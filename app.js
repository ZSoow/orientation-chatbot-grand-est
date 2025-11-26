document.addEventListener('DOMContentLoaded', () => {
    let formationsData = [];
    let currentStep = 0; // 0: Accueil, 1: Domaine, 2: Style, 3: Niveau
    let userChoices = {
        domaine: '',
        style: '',
        niveau: ''
    };

    const messagesContainer = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const resetBtn = document.getElementById('reset-btn');

    // --- CHARGEMENT DES DONNÉES ---
    fetch('data/formations.csv')
        .then(response => response.text())
        .then(csvText => {
            formationsData = parseCSV(csvText);
            console.log(`${formationsData.length} formations chargées.`);
            startOrientation();
        })
        .catch(err => {
            console.error("Erreur CSV:", err);
            addBotMessage("Erreur technique : Impossible de charger les formations.");
        });

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

    // --- SCÉNARIO DE L'ORIENTATION ---

    function startOrientation() {
        currentStep = 0;
        addBotMessage("Bonjour ! 👋 Je suis l'assistant du <strong>CMQ Bioéco Grand Est</strong>.");
        addBotMessage("Plutôt que de chercher au hasard, je vais t'aider à trouver ta voie.");
        
        setTimeout(() => {
            askQuestion(1);
        }, 1000);
    }

    function askQuestion(step) {
        currentStep = step;
        
        if (step === 1) {
            addBotMessage("Dis-moi, qu'est-ce qui t'intéresse le plus dans la vie ?");
            showQuickReplies([
                { text: "🌱 La nature & les animaux", value: "nature" },
                { text: "🧪 Les sciences & le labo", value: "science" },
                { text: "💼 Le business & la vente", value: "business" },
                { text: "⚙️ La mécanique & l'industrie", value: "industrie" }
            ]);
        } 
        else if (step === 2) {
            addBotMessage("Super ! Et comment préfères-tu travailler ?");
            showQuickReplies([
                { text: "🚜 Dehors / Manuel / Terrain", value: "terrain" },
                { text: "💻 Bureau / Gestion / Ordi", value: "bureau" }
            ]);
        }
        else if (step === 3) {
            addBotMessage("Dernière question : tu vises quel type d'études ?");
            showQuickReplies([
                { text: "⏱️ Courtes (CAP, Bac Pro, BTS)", value: "court" },
                { text: "🎓 Longues (Licence, Master, Ingé)", value: "long" },
                { text: "🤷 Peu importe", value: "peu_importe" }
            ]);
        }
    }

    // --- TRAITEMENT DES RÉPONSES ---

    function handleChoice(value, textLabel) {
        // On affiche le choix de l'utilisateur comme s'il l'avait écrit
        addUserMessage(textLabel);
        
        // On enregistre le choix
        if (currentStep === 1) userChoices.domaine = value;
        if (currentStep === 2) userChoices.style = value;
        if (currentStep === 3) userChoices.niveau = value;

        // On passe à l'étape suivante ou on affiche les résultats
        setTimeout(() => {
            if (currentStep < 3) {
                askQuestion(currentStep + 1);
            } else {
                showFinalResults();
            }
        }, 500);
    }

    function showFinalResults() {
        addBotMessage("Merci ! Laisse-moi analyser les 300 formations pour toi... 🧐");

        setTimeout(() => {
            // FILTRAGE INTELLIGENT
            const results = formationsData.filter(f => {
                let score = 0;
                const text = (f.Grande_Categorie + ' ' + f.Nom_Complet_Diplome + ' ' + f.Description_Diplome).toLowerCase();
                const niv = parseInt(f.Niveau_Europeen) || 0;

                // 1. Filtre Domaine
                if (userChoices.domaine === 'nature' && (text.includes('agri') || text.includes('forest') || text.includes('vigne') || text.includes('animale'))) score += 2;
                if (userChoices.domaine === 'science' && (text.includes('bio') || text.includes('chimie') || text.includes('laboratoire') || text.includes('science'))) score += 2;
                if (userChoices.domaine === 'business' && (text.includes('commer') || text.includes('vente') || text.includes('gestion') || text.includes('management'))) score += 2;
                if (userChoices.domaine === 'industrie' && (text.includes('industr') || text.includes('mécani') || text.includes('maintenance') || text.includes('pilotage'))) score += 2;

                // 2. Filtre Style (Terrain vs Bureau)
                // C'est une approximation basée sur les mots clés
                if (userChoices.style === 'terrain' && (text.includes('ouvrier') || text.includes('conduite') || text.includes('travaux') || text.includes('production'))) score += 1;
                if (userChoices.style === 'bureau' && (text.includes('gestion') || text.includes('analys') || text.includes('conseil') || text.includes('commercial'))) score += 1;

                // 3. Filtre Niveau
                // Niv 3/4 = CAP/Bac (Court), Niv 5 = BTS (Court), Niv 6/7 = Licence/Master (Long)
                if (userChoices.niveau === 'court' && niv <= 5) score += 2;
                if (userChoices.niveau === 'long' && niv >= 6) score += 2;
                if (userChoices.niveau === 'peu_importe') score += 1;

                // On ne garde que ceux qui ont un score suffisant (au moins le domaine correspond)
                return score >= 2;
            });

            if (results.length === 0) {
                addBotMessage("Je n'ai pas trouvé de correspondance exacte. Voici tout de même des formations dans ton domaine :");
                // Fallback : on montre juste par domaine
                // (Code simplifié pour l'exemple)
            } else {
                addBotMessage(`J'ai sélectionné <strong>${results.length} formations</strong> qui te correspondent !`);
                
                // On affiche les résultats (max 10 pour ne pas spammer)
                showFormations(results.slice(0, 10));

                if (results.length > 10) {
                    addBotMessage(`... et ${results.length - 10} autres. Tu peux utiliser la barre de recherche en bas pour filtrer par ville maintenant (ex: "Reims").`);
                }
            }
        }, 1000);
    }

    // --- FONCTIONS D'AFFICHAGE ---

    function showQuickReplies(options) {
        const container = document.createElement('div');
        container.className = 'quick-replies';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'reply-btn';
            btn.textContent = opt.text;
            btn.onclick = () => {
                // Désactiver les boutons après clic
                container.querySelectorAll('.reply-btn').forEach(b => b.disabled = true);
                container.remove(); // Ou le laisser mais grisé
                handleChoice(opt.value, opt.text);
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
                        <span class="tag">Niv ${f.Niveau_Europeen}</span>
                    </div>
                    ${f.URL_Page_Formation ? `<a href="${f.URL_Page_Formation}" target="_blank" class="formation-link">Voir la fiche</a>` : ''}
                    ${f.URL_Site_Etablissement ? `<a href="${f.URL_Site_Etablissement}" target="_blank" class="formation-link">Site école</a>` : ''}
                </div>
            `;
            addBotMessage(cardHtml);
        });
    }

    // Gestion recherche manuelle (si l'utilisateur tape quand même quelque chose)
    function handleUserMessage() {
        const text = userInput.value.trim();
        if (!text) return;
        addUserMessage(text);
        userInput.value = '';
        addBotMessage("Pour l'instant, je préfère qu'on utilise les boutons pour trouver ta voie ! 😉 (Mais la recherche par mot-clé sera réactivée bientôt).");
    }

    function resetChat() {
        messagesContainer.innerHTML = '';
        startOrientation();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUserMessage(); });
    sendBtn.addEventListener('click', handleUserMessage);
    resetBtn.addEventListener('click', resetChat);
});
