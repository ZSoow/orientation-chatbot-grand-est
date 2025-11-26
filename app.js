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
            // Message d'accueil personnalisé CMQ
            addBotMessage("Bonjour ! Je suis l'assistant virtuel du <strong>CMQ Bioéco Grand Est</strong>. 🌱");
            addBotMessage("Je peux vous aider à trouver une formation parmi nos 300 références.");
            addBotMessage("Essayez de combiner des mots-clés, par exemple : <br><em>'BTS Nancy'</em>, <em>'Agriculture Reims'</em> ou <em>'Commerce Alsace'</em>.");
        })
        .catch(err => {
            console.error("Erreur chargement CSV:", err);
            addBotMessage("Oups, je n'arrive pas à lire ma base de données de formations. 😕");
        });

    // 2. Fonction pour parser le CSV
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
        
        setTimeout(() => {
            processUserQuery(text);
        }, 600);
    }

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });
    sendBtn.addEventListener('click', handleUserMessage);

    // 4. Moteur de réponse (AMÉLIORÉ : Recherche multi-critères)
    function processUserQuery(query) {
        const rawQuery = query.toLowerCase();
        
        // Découpage de la recherche en mots-clés (on enlève les petits mots comme "à", "de", "le"...)
        const keywords = rawQuery.split(' ').filter(word => word.length > 1 && !['le', 'la', 'les', 'de', 'du', 'en', 'au', 'à', 'pour'].includes(word));

        // Mots clés simples pour les salutations
        if (['bonjour', 'salut', 'hello', 'cc', 'yo'].some(greet => rawQuery.includes(greet)) && keywords.length <= 1) {
            addBotMessage("Bonjour ! Dites-moi ce que vous cherchez (Ville, Diplôme, Domaine...).");
            return;
        }

        // Filtrage : On garde les formations qui contiennent TOUS les mots clés
        const results = formationsData.filter(f => {
            // On crée une grande chaîne de texte qui contient toutes les infos de la formation pour chercher dedans
            const formationFullText = `
                ${f.Nom_Complet_Diplome} 
                ${f.Acronyme_Diplome} 
                ${f.Grande_Categorie} 
                ${f.Description_Diplome} 
                ${f.Nom_Etablissement} 
                ${f.Ville} 
                ${f.Region}
            `.toLowerCase();

            // Vérifie si CHAQUE mot clé est présent dans le texte de la formation
            return keywords.every(keyword => formationFullText.includes(keyword));
        });

        // Affichage des résultats
        if (results.length === 0) {
            addBotMessage(`Je n'ai rien trouvé pour "${query}". 😕 <br>Essayez d'autres mots-clés ou vérifiez l'orthographe.`);
        } else if (results.length > 10) {
            addBotMessage(`J'ai trouvé <strong>${results.length} formations</strong> ! C'est un peu trop pour tout afficher.`);
            addBotMessage("Pouvez-vous préciser ? (Ajoutez une ville ou un niveau d'étude par exemple).");
            // On affiche quand même les 3 premières pour l'exemple
            showFormations(results.slice(0, 3));
        } else {
            addBotMessage(`Voici les <strong>${results.length} formations</strong> trouvées pour votre recherche :`);
            showFormations(results);
        }
    }

    // 5. Affichage des messages et cartes
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
