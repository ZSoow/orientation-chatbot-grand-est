document.addEventListener('DOMContentLoaded', () => {
    let formationsData = [];
    let fuse; // Variable pour le moteur de recherche
    let currentStep = 0;
    let userChoices = {
        domaine: '',
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
            initSearchEngine(); // Initialiser la recherche floue
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
            const values = line.split(';');
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
            });
            return obj;
        });
    }

    // --- CONFIGURATION DE LA RECHERCHE (FUSE.JS) ---
    function initSearchEngine() {
        const options = {
            includeScore: true,
            threshold: 0.4, // 0.0 = correspondance parfaite, 1.0 = correspond à tout (0.4 est un bon équilibre)
            keys: [
                // Liste des colonnes où on cherche (avec poids pour l'importance)
                { name: 'Nom_Complet_Diplome', weight: 0.4 },
                { name: 'Description_Diplome', weight: 0.2 },
                { name: 'Ville', weight: 0.2 },
                { name: 'Acronyme_Diplome', weight: 0.1 },
                { name: 'Nom_Etablissement', weight: 0.1 }
            ]
        };
        fuse = new Fuse(formationsData, options);
    }

    // --- SCÉNARIO ---

    function startOrientation() {
        currentStep = 0;
        userChoices = { domaine: '', niveau: '', region: '' };
        messagesContainer.innerHTML = ''; 
        
        addBotMessage("Bonjour ! 👋 Je suis l'assistant du <strong>CMQ Bioeco Academy Grand Est</strong>.");
        addBotMessage("Tu peux répondre aux questions ci-dessous OU taper directement ta recherche (ex: 'BTS Nancy', 'Soudure', 'Ingénieur').");
        
        setTimeout(() => askQuestion(1), 800);
    }

    function askQuestion(step) {
        currentStep = step;
        
        if (step === 1) {
            addBotMessage("Quel domaine t'intéresse ?");
            showQuickReplies([
                { text: "⚙️ Mécanique & Maintenance", value: "meca" },
                { text: "🚛 Logistique & Transport", value: "logistique" },
                { text: "🌱 Nature & Agronomie", value: "nature" },
                { text: "🧪 Sciences & Laboratoire", value: "science" },
                { text: "💼 Commerce & Gestion", value: "business" },
                { text: "🪵 Bois & Forêt", value: "bois" },
                { text: "💻 Informatique & Numérique", value: "info" }
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
                { text: "🎓 Avant le Bac (CAP, Bac Pro)", value: "avant_bac" },
                { text: "🚀 Bac +2 / +3 (BTS, Licence)", value: "bac_2_3" },
                { text: "🧠 Master / Ingénieur (Bac +5)", value: "master" },
                { text: "🔬 Doctorat / Recherche", value: "doctorat" }
            ]);
        }
    }

    // --- GESTION DES CLICS BOUTONS ---

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

    // --- GESTION DE LA RECHERCHE TEXTUELLE ---

    function handleSearch() {
        const query = userInput.value.trim();
        if (query.length < 2) return; // Évite les recherches trop courtes

        addUserMessage(query); // Affiche ce que l'utilisateur a tapé
        userInput.value = ''; // Vide le champ
        
        // Supprime les boutons de réponse rapide s'ils sont affichés car l'utilisateur a choisi de taper
        const existingReplies = document.querySelector('.quick-replies');
        if (existingReplies) existingReplies.remove();

        addBotMessage(`🔎 Recherche en cours pour : "<strong>${query}</strong>"...`);

        setTimeout(() => {
            // Utilisation de Fuse.js pour chercher
            const results = fuse.search(query);
            
            if (results.length === 0) {
                addBotMessage("😕 Je n'ai rien trouvé pour cette recherche.");
                addBotMessage("Essaie d'autres mots-clés ou utilise le parcours guidé.");
                showQuickReplies([{ text: "🔄 Retour au menu", value: "reset" }]);
            } else {
                // Fuse renvoie un objet { item: ..., score: ... }, on veut juste item
                // On limite aussi à 10 résultats pour ne pas flooder le chat
                const topResults = results.slice(0, 10).map(r => r.item);
                
                addBotMessage(`J'ai trouvé <strong>${results.length} formation(s)</strong> correspondant à ta recherche (voici les plus pertinentes) :`);
                showFormations(topResults);
                
                showQuickReplies([{ text: "🔄 Nouvelle recherche", value: "reset" }]);
            }
        }, 600);
    }


    // --- RÉSULTATS DU PARCOURS GUIDÉ ---

    function showFinalResults() {
        addBotMessage("🔍 Analyse de la base de données selon tes choix...");

        setTimeout(() => {
            const results = formationsData.filter(f => {
                const fullText = (f.Grande_Categorie + ' ' + f.Nom_Complet_Diplome + ' ' + f.Description_Diplome).toLowerCase();
                const region = f.Region ? f.Region.toLowerCase() : '';
                const ville = f.Ville ? f.Ville.toLowerCase() : '';
                const niveau = parseInt(f.Niveau_Europeen) || 0;

                let match = true;

                // Filtre DOMAINE
                if (userChoices.domaine === 'meca' && !fullText.includes('mécani') && !fullText.includes('mainten') && !fullText.includes('industri') && !fullText.includes('usinage') && !fullText.includes('robotique')) match = false;
                if (userChoices.domaine === 'logistique' && !fullText.includes('logist') && !fullText.includes('transport') && !fullText.includes('achat') && !fullText.includes('supply')) match = false;
                if (userChoices.domaine === 'nature' && !fullText.includes('agri') && !fullText.includes('agro') && !fullText.includes('nature') && !fullText.includes('paysage') && !fullText.includes('enviro')) match = false;
                if (userChoices.domaine === 'science' && !fullText.includes('scien') && !fullText.includes('labo') && !fullText.includes('bio') && !fullText.includes('chimie') && !fullText.includes('physique')) match = false;
                if (userChoices.domaine === 'business' && !fullText.includes('commer') && !fullText.includes('vent') && !fullText.includes('manage') && !fullText.includes('négocia') && !fullText.includes('eco')) match = false;
                if (userChoices.domaine === 'bois' && !fullText.includes('bois') && !fullText.includes('forêt') && !fullText.includes('menuisier')) match = false;
                if (userChoices.domaine === 'info' && !fullText.includes('infor') && !fullText.includes('numér') && !fullText.includes('réseau') && !fullText.includes('data')) match = false;

                // Filtre RÉGION
                if (userChoices.region !== 'tout') {
                    let regionMatch = false;
                    if (userChoices.region === 'champagne' && (region.includes('champagne') || ville.includes('reims') || ville.includes('troyes') || ville.includes('charleville') || ville.includes('chaumont'))) regionMatch = true;
                    if (userChoices.region === 'alsace' && (region.includes('alsace') || ville.includes('strasbourg') || ville.includes('mulhouse') || ville.includes('colmar'))) regionMatch = true;
                    if (userChoices.region === 'lorraine' && (region.includes('lorraine') || ville.includes('nancy') || ville.includes('metz') || ville.includes('epinal') || ville.includes('bar-le-duc'))) regionMatch = true;
                    if (!regionMatch) match = false;
                }

                // Filtre NIVEAU
                if (userChoices.niveau === 'avant_bac' && (niveau !== 3 && niveau !== 4)) match = false;
                else if (userChoices.niveau === 'bac_2_3' && (niveau !== 5 && niveau !== 6)) match = false;
                else if (userChoices.niveau === 'master' && niveau !== 7) match = false;
                else if (userChoices.niveau === 'doctorat' && (niveau !== 8 && !fullText.includes('doctorale'))) match = false;

                return match;
            });

            if (results.length === 0) {
                addBotMessage("😕 Je n'ai trouvé aucune formation correspondant exactement.");
                addBotMessage("Essaie d'élargir ta recherche.");
                showQuickReplies([{ text: "🔄 Recommencer", value: "reset" }]);
            } else {
                addBotMessage(`Bingo ! J'ai trouvé <strong>${results.length} formation(s)</strong> :`);
                
                // Tri par niveau
                results.sort((a, b) => (parseInt(a.Niveau_Europeen) || 0) - (parseInt(b.Niveau_Europeen) || 0));
                showFormations(results);
                
                if (results.length > 3) addBotMessage("💡 Astuce : utilise la barre de recherche pour être plus précis !");
                showQuickReplies([{ text: "🔄 Nouvelle recherche", value: "reset" }]);
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
            let buttonsHtml = '';
            if (f.URL_Page_Formation && f.URL_Page_Formation.length > 5) {
                buttonsHtml += `<a href="${f.URL_Page_Formation}" target="_blank" class="formation-link primary">Voir la fiche</a>`;
            }
            if (f.URL_Site_Etablissement && f.URL_Site_Etablissement.length > 5) {
                buttonsHtml += `<a href="${f.URL_Site_Etablissement}" target="_blank" class="formation-link secondary">Site école</a>`;
            }

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

    // Écouteurs d'événements pour la recherche
    resetBtn.addEventListener('click', resetChat);
    sendBtn.addEventListener('click', handleSearch);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});
