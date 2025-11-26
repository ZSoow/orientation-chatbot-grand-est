document.addEventListener('DOMContentLoaded', () => {
    let formationsData = [];
    let currentFilters = {
        keywords: []
    };

    const messagesContainer = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const resetBtn = document.getElementById('reset-btn');

    // 1. Chargement CSV
    fetch('data/formations.csv')
        .then(response => response.text())
        .then(csvText => {
            formationsData = parseCSV(csvText);
            console.log(`${formationsData.length} formations chargées.`);
            welcomeUser();
        })
        .catch(err => {
            console.error("Erreur CSV:", err);
            addBotMessage("Erreur technique : Impossible de charger les formations.");
        });

    function welcomeUser() {
        addBotMessage("Bonjour ! Je suis l'assistant du <strong>CMQ Bioéco Grand Est</strong>. 🌱");
        addBotMessage("Je peux vous aider à trouver une formation. Dites-moi ce que vous cherchez (ex: 'Commerce', 'BTS', 'Reims'...).");
    }

    // 2. Parser CSV
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(';').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.split(';');
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
            });
            return obj;
        });
    }

    // 3. Gestion Messages & Reset
    function handleUserMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        addUserMessage(text);
        userInput.value = '';
        
        // Petit délai pour effet naturel
        setTimeout(() => {
            processUserQuery(text);
        }, 500);
    }

    function resetChat() {
        messagesContainer.innerHTML = ''; // Vide le chat
        currentFilters.keywords = []; // Vide la mémoire
        welcomeUser(); // Relance l'accueil
    }

    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserMessage(); });
    sendBtn.addEventListener('click', handleUserMessage);
    resetBtn.addEventListener('click', resetChat);

    // 4. Cœur du Chatbot (Logique Guidée)
    function processUserQuery(query) {
        const rawQuery = query.toLowerCase();
        
        // Extraction des mots-clés
        const newKeywords = rawQuery.split(' ').filter(word => word.length > 2 && !['les', 'des', 'pour', 'une', 'dans', 'avec', 'sur'].includes(word));

        // MÉMOIRE : On ajoute les nouveaux mots aux anciens
        // Si l'utilisateur dit "Reims" puis "Commerce", on cherche "Reims" ET "Commerce"
        currentFilters.keywords = [...new Set([...currentFilters.keywords, ...newKeywords])];

        // Recherche
        const results = formationsData.filter(f => {
            const fullText = `
                ${f.Nom_Complet_Diplome} ${f.Acronyme_Diplome} 
                ${f.Grande_Categorie} ${f.Ville} ${f.Region}
            `.toLowerCase();
            // Vérifie que TOUS les mots-clés (anciens + nouveaux) sont présents
            return currentFilters.keywords.every(k => fullText.includes(k));
        });

        // Logique de réponse guidée
        if (results.length === 0) {
            addBotMessage(`Oups, je ne trouve rien avec "${currentFilters.keywords.join(' + ')}". 😕`);
            addBotMessage("Voulez-vous recommencer ? (Cliquez sur 'Nouveau' en haut à droite)");
            // On pourrait vider le dernier mot clé ici si on voulait être gentil, mais le Reset est mieux.
        } 
        else if (results.length > 10) {
            // TROP DE RÉSULTATS -> LE BOT POSE UNE QUESTION
            addBotMessage(`J'ai trouvé <strong>${results.length} formations</strong> ! C'est encore un peu large.`);
            
            // Est-ce qu'on a déjà filtré par ville ? (astuce simple : regarde si un mot clé ressemble à une ville connue)
            const cities = [...new Set(formationsData.map(f => f.Ville.toLowerCase()))];
            const hasCity = currentFilters.keywords.some(k => cities.includes(k));

            if (!hasCity) {
                addBotMessage("🔎 <strong>Dans quelle ville</strong> cherchez-vous ? (ex: Reims, Nancy, Strasbourg...)");
            } else {
                addBotMessage("🎓 Quel <strong>niveau</strong> ou domaine précis ? (ex: BTS, Ingénieur, Vigne, Bois...)");
            }
            
            // On montre quand même les 3 premiers pour donner une idée
            addBotMessage("Voici quelques exemples :");
            showFormations(results.slice(0, 3));
        } 
        else {
            // RÉSULTATS OK (<= 10)
            addBotMessage(`C'est précis ! Voici les <strong>${results.length} formations</strong> correspondantes :`);
            showFormations(results);
        }
    }

    // 5. Affichage
    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message user-message';
        div.textContent = text;
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function addBotMessage(htmlContent) {
        const div = document.createElement('div');
        div.className = 'message bot-message';
        div.innerHTML = htmlContent;
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function showFormations(formations) {
        formations.forEach(f => {
            const cardHtml = `
                <div class="formation-card">
                    <span class="formation-title">${f.Nom_Complet_Diplome}</span>
                    <div class="formation-school">🏫 ${f.Nom_Etablissement}</div>
                    <div class="formation-details">
                        <span class="tag">📍 ${f.Ville}</span>
                        <span class="tag">${f.Acronyme_Diplome}</span>
                        <span class="tag">Niv ${f.Niveau_Europeen}</span>
                    </div>
                    ${f.URL_Page_Formation ? `<a href="${f.URL_Page_Formation}" target="_blank" class="formation-link">Voir la fiche</a>` : ''}
                    ${f.URL_Site_Etablissement ? `<a href="${f.URL_Site_Etablissement}" target="_blank" class="formation-link">Site école</a>` : ''}
                </div>
            `;
            addBotMessage(cardHtml);
        });
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});
