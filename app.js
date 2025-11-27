document.addEventListener('DOMContentLoaded', () => {
    let formationsData = [];
    let currentStep = 0;
    let userChoices = {
        domaine: '',
        style: '', // Laissé pour compatibilité future
        niveau: '',
        region: ''
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
        .catch(err => {
            console.error("Erreur CSV :", err);
            addBotMessage("⚠️ Erreur lors du chargement des données. Vérifiez que le fichier 'data/formations.csv' existe bien.");
        });

    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(';').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            // Utilisation d'une Regex pour gérer les point-virgules à l'intérieur des champs si jamais il y en a (optionnel mais plus robuste)
            // Ici on garde le split simple car ton CSV a l'air propre
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
        userChoices = { domaine: '', style: '', niveau: '', region: '' };
        messagesContainer.innerHTML = ''; // Nettoyer au démarrage
        
        addBotMessage("Bonjour ! 👋 Je suis l'assistant du <strong>CMQ Bioeco Academy Grand Est</strong>.");
        addBotMessage("Je vais t'aider à trouver ta formation parmi notre nouvelle base de données.");
        
        setTimeout(() => askQuestion(1), 800);
    }

    function askQuestion(step) {
        currentStep = step;
        
        if (step === 1) {
            addBotMessage("Quel domaine t'intéresse ?");
            // J'ai mis à jour les choix pour correspondre aux catégories de ton fichier CSV
            showQuickReplies([
                { text: "⚙️ Mécanique & Maintenance", value: "meca" },
                { text: "🚛 Logistique & Transport", value: "logistique" },
                { text: "🌱 Nature & Agronomie", value: "nature" },
                { text: "🧪 Sciences & Laboratoire", value: "science" },
                { text: "💼 Commerce & Gestion", value: "business" },
                { text: "🪵 Bois & Forêt", value: "bois" }
            ]);
        } 
        else if (step === 2) {
            addBotMessage("Dans quelle zone du Grand Est ?");
            showQuickReplies([
                { text: "🍾 Champagne-Ardenne", value: "champagne" },
                { text: "🥨 Alsace", value: "alsace" },
                { text: "🏭 Lorraine", value: "lorraine" },
                { text: "🌍 Toute la région", value: "tout" }
            ]);
        }
        else if (step === 3) {
            addBotMessage("Quel niveau d'études vises-tu ?");
            showQuickReplies([
                { text: "⏱️ 3e / CAP / Bac", value: "court" },
                { text: "🎓 BTS / Licence / Master", value: "long" },
                { text: "🚀 Peu importe", value: "tout" }
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
        addBotMessage("🔍 Analyse de la base de données...");

        setTimeout(() => {
            const results = formationsData.filter(f => {
                // Création d'une chaîne de recherche complète pour être souple
                const fullText = (
                    f.Grande_Categorie + ' ' + 
                    f.Nom_Complet_Diplome + ' ' + 
                    f.Description_Diplome
                ).toLowerCase();
                
                const region = f.Region ? f.Region.toLowerCase() : '';
                const ville = f.Ville ? f.Ville.toLowerCase() : '';
                const niveau = parseInt(f.Niveau_Europeen) || 0; // Convertir "3" en entier 3

                let match = true;

                // 1. Filtre DOMAINE (Adapté à tes nouvelles catégories CSV)
                if (userChoices.domaine === 'meca' && !fullText.includes('mécani') && !fullText.includes('mainten') && !fullText.includes('industri') && !fullText.includes('usinage')) match = false;
                
                if (userChoices.domaine === 'logistique' && !fullText.includes('logist') && !fullText.includes('transport') && !fullText.includes('achat') && !fullText.includes('supply')) match = false;
                
                if (userChoices.domaine === 'nature' && !fullText.includes('agri') && !fullText.includes('agro') && !fullText.includes('nature') && !fullText.includes('paysage')) match = false;
                
                if (userChoices.domaine === 'science' && !fullText.includes('scien') && !fullText.includes('labo') && !fullText.includes('bio') && !fullText.includes('chimie') && !fullText.includes('physique')) match = false;
                
                if (userChoices.domaine === 'business' && !fullText.includes('commer') && !fullText.includes('vent') && !fullText.includes('manage') && !fullText.includes('négocia')) match = false;
                
                if (userChoices.domaine === 'bois' && !fullText.includes('bois') && !fullText.includes('forêt') && !fullText.includes('menuisier')) match = false;

                // 2. Filtre RÉGION
                if (userChoices.region !== 'tout') {
                    // On vérifie si la région ou une ville majeure est présente
                    let regionMatch = false;
                    if (userChoices.region === 'champagne' && (region.includes('champagne') || ville.includes('reims') || ville.includes('troyes'))) regionMatch = true;
                    if (userChoices.region === 'alsace' && (region.includes('alsace') || ville.includes('strasbourg') || ville.includes('mulhouse'))) regionMatch = true;
                    if (userChoices.region === 'lorraine' && (region.includes('lorraine') || ville.includes('nancy') || ville.includes('metz'))) regionMatch = true;
                    
                    if (!regionMatch) match = false;
                }

                // 3. Filtre NIVEAU
                // Niv 3 = CAP, Niv 4 = Bac, Niv 5 = BTS, Niv 6 = Licence, Niv 7 = Master, Niv 8 = Doc
                if (userChoices.niveau === 'court') {
                    if (niveau > 4) match = false; // On garde CAP (3) et Bac (4)
                }
                if (userChoices.niveau === 'long') {
                    if (niveau < 5) match = false; // On garde BTS (5) et plus
                }

                return match;
            });

            if (results.length === 0) {
                addBotMessage("😕 Je n'ai trouvé aucune formation correspondant exactement.");
                addBotMessage("Essaie d'élargir ta recherche (par exemple : Région 'Peu importe').");
                showQuickReplies([{ text: "🔄 Recommencer", value: "reset" }]);
            } else {
                const count = results.length;
                addBotMessage(`Bingo ! J'ai trouvé <strong>${count} formation(s)</strong> :`);
                
                // Tri : d'abord par niveau, puis par nom
                results.sort((a, b) => {
                    const nivA = parseInt(a.Niveau_Europeen) || 0;
                    const nivB = parseInt(b.Niveau_Europeen) || 0;
                    return nivA - nivB;
                });

                showFormations(results);
                
                if (count > 3) {
                    addBotMessage("💡 Astuce : utilise le bouton 'Nouveau' pour changer de critères.");
                }
            }
        }, 800);
    }

    // --- AFFICHAGE ---

    function showQuickReplies(options) {
        const container = document.createElement('div');
        container.className = 'quick-replies';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'reply-btn';
            btn.innerHTML = opt.text;
            btn.onclick = () => {
                if (opt.value === 'reset') {
                    resetChat();
                } else {
                    container.remove(); // Supprime les boutons après clic
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
            // Construction des boutons URL (si les liens existent)
            let buttonsHtml = '';
            
            // Priorité 1 : Page formation spécifique
            if (f.URL_Page_Formation && f.URL_Page_Formation.length > 5) {
                buttonsHtml += `<a href="${f.URL_Page_Formation}" target="_blank" class="formation-link primary">Voir la fiche</a>`;
            }
            
            // Priorité 2 : Site établissement
            if (f.URL_Site_Etablissement && f.URL_Site_Etablissement.length > 5) {
                buttonsHtml += `<a href="${f.URL_Site_Etablissement}" target="_blank" class="formation-link secondary">Site école</a>`;
            }

            // Gestion de la date de portes ouvertes
            let dateHtml = '';
            if (f.Dates_Portes_Ouvertes && f.Dates_Portes_Ouvertes.length > 2) {
                dateHtml = `<div class="formation-date">📅 JPO : ${f.Dates_Portes_Ouvertes}</div>`;
            }

            const cardHtml = `
                <div class="formation-card">
                    <span class="formation-title">${f.Nom_Complet_Diplome}</span>
                    <div class="formation-school">🏫 ${f.Nom_Etablissement}</div>
                    
                    <div class="formation-details">
                        <span class="tag">📍 ${f.Ville}</span>
                        <span class="tag">${f.Acronyme_Diplome}</span>
                        <span class="tag level">Niv ${f.Niveau_Europeen}</span>
                    </div>

                    ${dateHtml}

                    ${buttonsHtml ? `<div class="formation-actions">${buttonsHtml}</div>` : ''}
                </div>
            `;
            addBotMessage(cardHtml);
        });
    }

    function resetChat() {
        startOrientation();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    resetBtn.addEventListener('click', resetChat);
    
    // Gestion de l'input "Entrée" pour envoyer (même si désactivé par défaut ici)
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            // Logique textuelle si tu veux la réactiver plus tard
        }
    });
});
