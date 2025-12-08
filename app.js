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

    // --- 1. CHARGEMENT DES DONNÉES ---
    fetch('data/formations.csv')
        .then(response => response.text())
        .then(csvText => {
            formationsData = parseCSV(csvText);
            startOrientation();
        })
        .catch(err => {
            console.error("Erreur CSV :", err);
            addBotMessage("⚠️ Erreur : Impossible de charger le fichier data/formations.csv");
        });

    function parseCSV(text) {
        const lines = text.trim().split('\n');
        // Si le fichier est vide ou mal formé
        if (lines.length < 2) return [];

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

    // --- 2. LOGIQUE DU CHAT ---

    function startOrientation() {
        currentStep = 0;
        userChoices = { domaine: '', niveau: '', region: '' };
        messagesContainer.innerHTML = ''; // Vide le chat
        
        addBotMessage("Bonjour ! 👋 Je suis l'assistant du <strong>CMQ Bioeco Academy Grand Est</strong>.");
        addBotMessage("Je vais t'aider à trouver ta formation.");
        
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

    function handleChoice(value, textLabel) {
        addUserMessage(textLabel);
        
        if (currentStep === 1) userChoices.domaine = value;
        if (currentStep === 2) userChoices.region = value;
        if (currentStep === 3) {
            userChoices.niveau = value;
            processResults(); // Lance la recherche
        } else {
            setTimeout(() => askQuestion(currentStep + 1), 500);
        }
    }

    // --- 3. TRAITEMENT ET AFFICHAGE ---

    function processResults() {
        addBotMessage("🔍 Recherche des formations...");

        setTimeout(() => {
            // A. FILTRAGE
            const filtered = formationsData.filter(f => {
                const fullText = (f.Grande_Categorie + ' ' + f.Nom_Complet_Diplome).toLowerCase();
                const region = (f.Region || '').toLowerCase();
                const ville = (f.Ville || '').toLowerCase();
                const niveau = parseInt(f.Niveau_Europeen) || 0;

                let match = true;

                // Domaine
                if (userChoices.domaine === 'meca' && !fullText.includes('mécani') && !fullText.includes('mainten') && !fullText.includes('industri')) match = false;
                if (userChoices.domaine === 'logistique' && !fullText.includes('logist') && !fullText.includes('transport')) match = false;
                if (userChoices.domaine === 'nature' && !fullText.includes('agri') && !fullText.includes('agro') && !fullText.includes('nature') && !fullText.includes('enviro')) match = false;
                if (userChoices.domaine === 'science' && !fullText.includes('scien') && !fullText.includes('labo') && !fullText.includes('bio') && !fullText.includes('chimie')) match = false;
                if (userChoices.domaine === 'business' && !fullText.includes('commer') && !fullText.includes('vent') && !fullText.includes('manage')) match = false;
                if (userChoices.domaine === 'bois' && !fullText.includes('bois') && !fullText.includes('forêt')) match = false;
                if (userChoices.domaine === 'info' && !fullText.includes('infor') && !fullText.includes('numér') && !fullText.includes('réseau')) match = false;

                // Région
                if (userChoices.region !== 'tout') {
                    let regionMatch = false;
                    if (userChoices.region === 'champagne' && (region.includes('champagne') || ville.includes('reims') || ville.includes('troyes'))) regionMatch = true;
                    if (userChoices.region === 'alsace' && (region.includes('alsace') || ville.includes('strasbourg') || ville.includes('mulhouse'))) regionMatch = true;
                    if (userChoices.region === 'lorraine' && (region.includes('lorraine') || ville.includes('nancy') || ville.includes('metz'))) regionMatch = true;
                    if (!regionMatch) match = false;
                }

                // Niveau
                if (userChoices.niveau === 'avant_bac' && (niveau !== 3 && niveau !== 4)) match = false;
                if (userChoices.niveau === 'bac_2_3' && (niveau !== 5 && niveau !== 6)) match = false;
                if (userChoices.niveau === 'master' && niveau !== 7) match = false;
                if (userChoices.niveau === 'doctorat' && niveau !== 8) match = false;

                return match;
            });

            if (filtered.length === 0) {
                addBotMessage("😕 Aucune formation trouvée avec ces critères exacts.");
                showQuickReplies([{ text: "🔄 Recommencer", value: "reset" }]);
                return;
            }

            // B. REGROUPEMENT PAR DIPLÔME
            const grouped = {};
            filtered.forEach(f => {
                const key = f.Nom_Complet_Diplome || "Autre";
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(f);
            });

            const nbDiplomes = Object.keys(grouped).length;
            addBotMessage(`J'ai trouvé <strong>${filtered.length} formations</strong> réparties sur <strong>${nbDiplomes} diplômes</strong> :`);

            // C. AFFICHAGE EN GRILLE
            showGrid(grouped);
            
            showQuickReplies([{ text: "🔄 Nouvelle recherche", value: "reset" }]);

        }, 800);
    }

    function showGrid(groupedData) {
        // 1. Création du conteneur grille
        const gridContainer = document.createElement('div');
        gridContainer.className = 'results-grid';

        // 2. Boucle sur chaque diplôme unique
        for (const [title, group] of Object.entries(groupedData)) {
            const info = group[0]; // Infos communes (niveau, acronyme)

            // Liste des écoles (HTML)
            let schoolsHtml = `<ul class="schools-list">`;
            group.forEach(ecole => {
                let linkHtml = '';
                if (ecole.URL_Site_Etablissement && ecole.URL_Site_Etablissement.length > 5) {
                    linkHtml = `<a href="${ecole.URL_Site_Etablissement}" target="_blank" class="school-link">Site</a>`;
                }

                schoolsHtml += `
                    <li>
                        <span class="school-name">${ecole.Nom_Etablissement}</span>
                        <div class="school-meta">
                            <span>📍 ${ecole.Ville}</span>
                            ${linkHtml}
                        </div>
                    </li>
                `;
            });
            schoolsHtml += `</ul>`;

            // Bouton fiche formation (si dispo)
            let footerHtml = '';
            if (info.URL_Page_Formation && info.URL_Page_Formation.length > 5) {
                footerHtml = `
                    <div class="card-footer">
                        <a href="${info.URL_Page_Formation}" target="_blank" class="btn-full">Voir la fiche complète</a>
                    </div>
                `;
            }

            // Création de la carte DOM
            const card = document.createElement('div');
            card.className = 'formation-card';
            card.innerHTML = `
                <div class="card-header">
                    <span class="formation-title">${title}</span>
                    <div class="card-tags">
                        <span class="tag level">Niv ${info.Niveau_Europeen}</span>
                        ${info.Acronyme_Diplome ? `<span class="tag">${info.Acronyme_Diplome}</span>` : ''}
                    </div>
                </div>
                ${schoolsHtml}
                ${footerHtml}
            `;

            gridContainer.appendChild(card);
        }

        // 3. Ajout au chat
        messagesContainer.appendChild(gridContainer);
        scrollToBottom();
    }

    // --- UTILITAIRES ---

    function showQuickReplies(options) {
        const div = document.createElement('div');
        div.className = 'quick-replies';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'reply-btn';
            btn.innerText = opt.text;
            btn.onclick = () => {
                if (opt.value === 'reset') resetChat();
                else {
                    div.remove();
                    handleChoice(opt.value, opt.text);
                }
            };
            div.appendChild(btn);
        });
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function addBotMessage(html) {
        const div = document.createElement('div');
        div.className = 'message bot-message';
        div.innerHTML = html;
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message user-message';
        div.innerText = text;
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function resetChat() {
        startOrientation();
    }

    if (resetBtn) resetBtn.addEventListener('click', resetChat);
});
