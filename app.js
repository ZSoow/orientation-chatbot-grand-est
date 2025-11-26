document.addEventListener('DOMContentLoaded', () => {
    let formationsData = [];
    const messagesContainer = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // 1. Chargement des données CSV
    fetch('data/formations.csv')
        .then(response => response.text())
        .then(csvText => {
            formationsData = parseCSV(csvText);
            console.log(`${formationsData.length} formations chargées.`);
            addBotMessage("Bonjour ! 👋 Je suis votre assistant d'orientation Grand Est. Je connais plus de 300 formations.");
            addBotMessage("Dites-moi ce que vous cherchez (ex: 'BTS', 'Nancy', 'Agriculture', 'Commerce'...) ou posez une question !");
        })
        .catch(err => {
            console.error("Erreur chargement CSV:", err);
            addBotMessage("Oups, je n'arrive pas à lire ma base de données de formations. 😕");
        });

    // 2. Fonction pour parser le CSV (point-virgule comme séparateur)
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

    // 3. Gestion de l'envoi de message
    function handleUserMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        addUserMessage(text);
        userInput.value = '';
        
        // Simuler un délai de réflexion
        setTimeout(() => {
            processUserQuery(text);
        }, 600);
    }

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });
    sendBtn.addEventListener('click', handleUserMessage);

    // 4. Moteur de réponse
    function processUserQuery(query) {
        const lowerQuery = query.toLowerCase();

        // Mots clés simples pour les salutations
        if (['bonjour', 'salut', 'hello', 'cc'].includes(lowerQuery)) {
            addBotMessage("Salut ! Prêt à trouver ton avenir ? Dis-moi ce qui t'intéresse.");
            return;
        }

        // Recherche dans les données
        const results = formationsData.filter(f => {
            return (
                f.Nom_Complet_Diplome.toLowerCase().includes(lowerQuery) ||
                f.Ville.toLowerCase().includes(lowerQuery) ||
                f.Grande_Categorie.toLowerCase().includes(lowerQuery) ||
                f.Description_Diplome.toLowerCase().includes(lowerQuery) ||
                f.Acronyme_Diplome.toLowerCase().includes(lowerQuery)
            );
        });

        if (results.length === 0) {
            addBotMessage("Je n'ai trouvé aucune formation correspondant exactement à ça. Essayez un nom de ville (ex: Reims) ou un domaine (ex: Commerce).");
        } else if (results.length > 10) {
            addBotMessage(`J'ai trouvé ${results.length} formations ! C'est beaucoup. Pouvez-vous être plus précis ? (ajoutez une ville par exemple)`);
            // On affiche quand même les 3 premières pour l'exemple
            showFormations(results.slice(0, 3));
        } else {
            addBotMessage(`Voici ce que j'ai trouvé (${results.length} résultats) :`);
            showFormations(results);
        }
    }

    // 5. Affichage des messages
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
        div.innerHTML = htmlContent; // Permet d'insérer du HTML (liens, gras...)
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function showFormations(formations) {
        formations.forEach(f => {
            const cardHtml = `
                <div class="formation-card">
                    <span class="formation-title">${f.Nom_Complet_Diplome} (${f.Acronyme_Diplome})</span>
                    <div class="formation-school">🏫 ${f.Nom_Etablissement}</div>
                    <div class="formation-details">
                        <span class="tag">📍 ${f.Ville} (${f.Code_Postal})</span>
                        <span class="tag">🎓 Niv ${f.Niveau_Europeen}</span>
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
