document.addEventListener('DOMContentLoaded', () => {
    let formationsData = [];
    let currentStep = 0;
    let userChoices = {
        domaine: '',
        niveau: '',
        region: ''
    };

    const messagesContainer = document.getElementById('chat-messages');
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
        userChoices = { domaine: '', niveau: '', region: '' };
        messagesContainer.innerHTML = '';
        
        addBotMessage("Bonjour ! 👋 Je suis l'assistant du <strong>CMQ Bioeco Academy Grand Est</strong>.");
        addBotMessage("Je vais t'aider à trouver ta formation parmi notre base de données.");
        
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
                const fullText = (
                    f.Grande_Categorie + ' ' + 
                    f.Nom_Complet_Diplome + ' ' + 
                    f.Description_Diplome
                ).toLowerCase();
                
                const region = f.Region ? f.Region.toLowerCase() : '';
                const ville = f.Ville ? f.Ville.toLowerCase() : '';
                const niveau = parseInt(f.Niveau_Europeen) || 0;

                let match = true;

                // 1. Filtre DOMAINE
                if (userChoices.domaine === 'meca' && !fullText.includes('mécani') && !fullText.includes('mainten') && !fullText.includes('industri') && !fullText.includes('usinage') && !fullText.includes('robotique')) match = false;
                if (userChoices.domaine === 'logistique' && !fullText.includes('logist') && !fullText.includes('transport') && !fullText.includes('achat') && !fullText.includes('supply')) match = false;
                if (userChoices.domaine === 'nature' && !fullText.includes('agri') && !fullText.includes('agro') && !fullText.includes('nature') && !fullText.includes('paysage') && !fullText.includes('enviro')) match = false;
                if (userChoices.domaine === 'science' && !fullText.includes('scien') && !fullText.includes('labo') && !fullText.includes('bio') && !fullText.includes('chimie') && !fullText.includes('physique')) match = false;
                if (userChoices.domaine === 'business' && !fullText.includes('commer') && !fullText.includes('vent') && !fullText.includes('manage') && !fullText.includes('négocia') && !fullText.includes('eco')) match = false;
                if (userChoices.domaine === 'bois' && !fullText.includes('bois') && !fullText.includes('forêt') && !fullText.includes('menuisier')) match = false;
                if (userChoices.domaine === 'info' && !fullText.includes('infor') && !fullText.includes('numér') && !fullText.includes('réseau') && !fullText.includes('data')) match = false;

                // 2. Filtre RÉGION
                if (userChoices.region !== 'tout') {
                    let regionMatch = false;
                    if (userChoices.region === 'champagne' && (region.includes('champagne') || ville.includes('reims') || ville.includes('troyes') || ville.includes('charleville') || ville.includes('chaumont'))) regionMatch = true;
                    if (userChoices.region === 'alsace' && (region.includes('alsace') || ville.includes('strasbourg') || ville.includes('mulhouse') || ville.includes('colmar'))) regionMatch = true;
                    if (userChoices.region === 'lorraine' && (region.includes('lorraine') || ville.includes('nancy') || ville.includes('metz') || ville.includes('epinal') || ville.includes('bar-le-duc'))) regionMatch = true;
                    if (!regionMatch) match = false;
                }

                // 3. Filtre NIVEAU
                if (userChoices.niveau === 'avant_bac' && (niveau !== 3 && niveau !== 4)) match = false;
                else if (userChoices.niveau === 'bac_2_3' && (niveau !== 5 && niveau !== 6)) match = false;
                else if (userChoices.niveau === 'master' && niveau !== 7) match = false;
                else if (userChoices.niveau === 'doctorat' && niveau !== 8 && !fullText.includes('doctorale')) match = false;

                return match;
            });

            if (results.length === 0) {
                addBotMessage("😕 Je n'ai trouvé aucune formation correspondant exactement.");
                addBotMessage("Essaie d'élargir ta recherche (par exemple : Région 'Toute la région').");
                showQuickReplies([{ text: "🔄 Recommencer", value: "reset" }]);
            } else {
                const count = results.length;
                
                // LOGIQUE DE REGROUPEMENT
                // On regroupe les formations par leur "Nom_Complet_Diplome"
                const groupedResults = results.reduce((acc, curr) => {
                    const key = curr.Nom_Complet_Diplome || "Formation inconnue";
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(curr);
                    return acc;
                }, {});

                const numberOfGroups = Object.keys(groupedResults).length;
                addBotMessage(`Bingo ! J'ai trouvé <strong>${count} formation(s)</strong> réparties sur <strong>${numberOfGroups} diplôme(s)</strong> :`);

                showFormationsGrouped(groupedResults);
                
                if (numberOfGroups > 3) {
                    addBotMessage("💡 Astuce : utilise le bouton 'Nouveau' pour changer de critères.");
                }
                showQuickReplies([{ text: "🔄 Nouvelle recherche", value: "reset" }]);
            }
        }, 800);
    }

    // --- FONCTION D'AFFICHAGE REGROUPÉ ---

        // ... (Le reste du code avant reste identique)

    function showGroupedFormations(groupedResults) {
        // 1. CRÉATION DU CONTENEUR GRILLE (C'est ce qui manquait !)
        const gridContainer = document.createElement('div');
        gridContainer.className = 'results-grid'; 

        // 2. On parcourt chaque groupe (chaque type de diplôme unique)
        Object.keys(groupedResults).forEach(key => {
            const group = groupedResults[key];
            const firstFormation = group[0]; // On prend les infos communes du premier élément

            // On prépare la liste des établissements
            let schoolsHtml = '<ul class="schools-list">';
            group.forEach(f => {
                // Bouton "Site école" s'il existe
                let linkHtml = '';
                if (f.URL_Site_Etablissement && f.URL_Site_Etablissement.length > 5) {
                    linkHtml = `<a href="${f.URL_Site_Etablissement}" target="_blank" title="Site web">🌐</a>`;
                }
                
                // JPO
                let jpoHtml = '';
                if (f.Dates_Portes_Ouvertes && f.Dates_Portes_Ouvertes.length > 2) {
                    jpoHtml = `<div class="mini-jpo">📅 ${f.Dates_Portes_Ouvertes}</div>`;
                }

                schoolsHtml += `
                    <li>
                        <div class="school-header">
                            <strong>${f.Nom_Etablissement}</strong> (${f.Ville})
                            ${linkHtml}
                        </div>
                        ${jpoHtml}
                    </li>`;
            });
            schoolsHtml += '</ul>';

            // Lien fiche formation (commun à tous, on prend le premier qui a un lien)
            const ficheUrl = group.find(g => g.URL_Page_Formation && g.URL_Page_Formation.length > 5)?.URL_Page_Formation;
            let mainButtonHtml = '';
            if (ficheUrl) {
                mainButtonHtml = `<a href="${ficheUrl}" target="_blank" class="formation-link primary">📄 Voir la fiche formation</a>`;
            }

            // 3. Création de la carte
            const card = document.createElement('div');
            card.className = 'formation-card';
            card.innerHTML = `
                <span class="formation-title">${firstFormation.Nom_Complet_Diplome}</span>
                
                <div class="formation-details">
                    <span class="tag">${firstFormation.Acronyme_Diplome}</span>
                    <span class="tag level">Niv ${firstFormation.Niveau_Europeen}</span>
                    <span class="tag count">${group.length} établissement(s)</span>
                </div>

                <div class="schools-container">
                    ${schoolsHtml}
                </div>

                ${mainButtonHtml ? `<div class="formation-actions">${mainButtonHtml}</div>` : ''}
            `;
            
            // 4. Ajout de la carte DANS la grille (et non directement dans le chat)
            gridContainer.appendChild(card);
        });

        // 5. Ajout de la grille complète au chat
        messagesContainer.appendChild(gridContainer);
        scrollToBottom();
    }
    
    // ... (Le reste du code resetChat etc. reste identique)

            schoolsListHtml += '</div>'; // Fin de la liste

            // Création de la carte complète
            gridHtml += `
                <div class="formation-card">
                    <div class="card-header">
                        <span class="formation-title">${diplomeName}</span>
                        <div class="card-tags">
                            ${acronyme ? `<span class="tag">${acronyme}</span>` : ''}
                            <span class="tag level">Niv ${niveau}</span>
                        </div>
                    </div>
                    ${schoolsListHtml}
                </div>
            `;
        }

        gridHtml += '</div>'; // Fin de la grille

        // Envoi en mode "full-width" pour prendre tout l'écran
        addBotMessage(gridHtml, 'full-width');
    }

    // --- UTILITAIRES ---

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

    function addBotMessage(htmlContent, className = '') {
        const div = document.createElement('div');
        div.className = 'message bot-message ' + className;
        div.innerHTML = htmlContent;
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function resetChat() {
        startOrientation();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    resetBtn.addEventListener('click', resetChat);
});
