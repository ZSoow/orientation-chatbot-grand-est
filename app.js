document.addEventListener('DOMContentLoaded', () => {
    let formationsData = [];
    let currentStep = 0;
    let userChoices = {
        domaine: '',
        style: '',
        niveau: '',
        region: '' // Nouveau critère
    };

    const messagesContainer = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const resetBtn = document.getElementById('reset-btn');

    // --- CHARGEMENT ---
    fetch('data/formations.csv')
        .then(response => response.text())
        .then(csvText => {
            formationsData = parseCSV(csvText);
            startOrientation();
        })
        .catch(err => console.error("Erreur CSV:", err));

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

    // --- SCÉNARIO ---

    function startOrientation() {
        currentStep = 0;
        userChoices = { domaine: '', style: '', niveau: '', region: '' }; // Reset total
        addBotMessage("Bonjour ! 👋 Je suis l'assistant du <strong>CMQ Bioéco Grand Est</strong>.");
        addBotMessage("Je vais t'aider à trouver ta formation idéale en quelques clics.");
        
        setTimeout(() => askQuestion(1), 800);
    }

    function askQuestion(step) {
        currentStep = step;
        
        if (step === 1) {
            addBotMessage("D'abord, quel univers t'attire le plus ?");
            showQuickReplies([
                { text: "🌱 Nature & Agriculture", value: "nature" },
                { text: "🍇 Vigne & Vin", value: "vigne" }, // Séparé pour le CMQ Bioéco
                { text: "🧪 Sciences & Labo", value: "science" },
                { text: "💼 Commerce & Gestion", value: "business" },
                { text: "⚙️ Industrie & Maintenance", value: "industrie" },
                { text: "🪵 Bois & Forêt", value: "bois" } // Séparé aussi
            ]);
        } 
        else if (step === 2) {
            addBotMessage("C'est noté. Dans quelle zone du Grand Est cherches-tu ?");
            showQuickReplies([
                { text: "🍾 Champagne-Ardenne (Reims/Troyes...)", value: "champagne" },
                { text: "🥨 Alsace (Strasbourg/Mulhouse...)", value: "alsace" },
                { text: "🏭 Lorraine (Nancy/Metz...)", value: "lorraine" },
                { text: "🌍 Peu importe / Je suis mobile", value: "tout" }
            ]);
        }
        else if (step === 3) {
            addBotMessage("Quel niveau d'études vises-tu ?");
            showQuickReplies([
                { text: "⏱️ Courtes (CAP à BTS)", value: "court" },
                { text: "🎓 Longues (Licence à Ingénieur)", value: "long" },
                { text: "🚀 Tout voir", value: "tout" }
            ]);
        }
    }

    // --- MOTEUR DE RECHERCHE ---

    function handleChoice(value, textLabel) {
        addUserMessage(textLabel);
        
        if (currentStep === 1) userChoices.domaine = value;
        if (currentStep === 2) userChoices.region = value;
        if (currentStep === 3) {
            userChoices.niveau = value;
            showFinalResults();
        } else {
            setTimeout(() => askQuestion(currentStep + 1), 600);
        }
    }

    function showFinalResults() {
        addBotMessage("🔍 Analyse en cours...");

        setTimeout(() => {
            const results = formationsData.filter(f => {
                const text = (f.Grande_Categorie + ' ' + f.Nom_Complet_Diplome + ' ' + f.Description_Diplome).toLowerCase();
                const region = f.Region ? f.Region.toLowerCase() : '';
                const ville = f.Ville ? f.Ville.toLowerCase() : '';
                const niv = parseInt(f.Niveau_Europeen) || 0;

                let match = true;

                // 1. Filtre DOMAINE (Strict)
                if (userChoices.domaine === 'nature' && !(text.includes('agri') || text.includes('elevage') || text.includes('animale'))) match = false;
                if (userChoices.domaine === 'vigne' && !(text.includes('vigne') || text.includes('vin') || text.includes('vitico'))) match = false;
                if (userChoices.domaine === 'bois' && !(text.includes('bois') || text.includes('foret') || text.includes('bûcheron'))) match = false;
                if (userChoices.domaine === 'science' && !(text.includes('bio') || text.includes('chimie') || text.includes('labo'))) match = false;
                if (userChoices.domaine === 'business' && !(text.includes('commer') || text.includes('vente') || text.includes('manage'))) match = false;
                if (userChoices.domaine === 'industrie' && !(text.includes('industr') || text.includes('mécani') || text.includes('mainten'))) match = false;

                // 2. Filtre RÉGION
                if (userChoices.region !== 'tout') {
                    if (userChoices.region === 'champagne' && !region.includes('champagne') && !ville.includes('reims') && !ville.includes('troyes')) match = false;
                    if (userChoices.region === 'alsace' && !region.includes('alsace') && !ville.includes('strasbourg')) match = false;
                    if (userChoices.region === 'lorraine' && !region.includes('lorraine') && !ville.includes('nancy') && !ville.includes('metz')) match = false;
                }

                // 3. Filtre NIVEAU
                if (userChoices.niveau === 'court' && niv > 5) match = false; // Max BTS (Niv 5)
                if (userChoices.niveau === 'long' && niv < 6) match = false;  // Min Licence (Niv 6)

                return match;
            });

            if (results.length === 0) {
                addBotMessage("😕 Aïe, aucune formation ne correspond exactement à ces 3 critères combinés.");
                addBotMessage("Essaie de relancer en mettant 'Peu importe' pour la région ou le niveau.");
                showQuickReplies([{ text: "🔄 Recommencer", value: "reset" }]);
            } else {
                const count = results.length;
                addBotMessage(`Bingo ! J'ai trouvé <strong>${count} formation(s)</strong> parfaite(s) pour toi :`);
                
                // Tri par niveau d'étude croissant
                results.sort((a, b) => a.Niveau_Europeen - b.Niveau_Europeen);

                showFormations(results);
                
                if (count > 1) {
                    addBotMessage("Tu peux cliquer sur 'Nouveau' en haut pour une autre recherche.");
                }
            }
        }, 1000);
    }

    // --- AFFICHAGE ---

    function showQuickReplies(options) {
        const container = document.createElement('div');
        container.className = 'quick-replies';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'reply-btn';
            btn.innerHTML = opt.text; // innerHTML permet le gras ou span si besoin
            btn.onclick = () => {
                if (opt.value === 'reset') {
                    resetChat();
                } else {
                    container.remove(); 
                    handleChoice(opt.value, opt.text);
                }
            };
            container.appendChild(btn);
        });
        
        messagesContainer.appendChild(container);
        scrollToBottom();
    }

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
                        <span class="tag level">Niv ${f.Niveau_Europeen}</span>
                    </div>
                    ${f.URL_Page_Formation ? `<a href="${f.URL_Page_Formation}" target="_blank" class="formation-link">Voir la fiche</a>` : ''}
                </div>
            `;
            addBotMessage(cardHtml);
        });
    }

    function resetChat() {
        messagesContainer.innerHTML = '';
        startOrientation();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    resetBtn.addEventListener('click', resetChat);
    // Désactivation temporaire de l'input texte pour forcer l'usage des boutons
    userInput.disabled = true;
    userInput.placeholder = "Utilisez les boutons de choix 👆";
});
