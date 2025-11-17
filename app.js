// --- Éléments du DOM ---
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const mapContainer = document.getElementById('map-container');
const mapElement = document.getElementById('map');

// --- Variables d'état ---
let state = 'START';
let quizScores = {};
let filterCriteria = {};
let db = [];
let map = null; // Variable pour garder une référence à la carte

// --- Base de données de la conversation (Quiz) ---
const conversation = {
    quiz: [
        { id: 'Q1', question: "Tu es dans un atelier. Quel est ton premier réflexe ?", answers: [
            { text: "Démonter un moteur pour voir comment ça marche.", points: ["MÉCANIQUE ET MAINTENANCE", "INDUSTRIE, PRODUCTION, PROCÉDÉS ET USINAGE"] },
            { text: "Réorganiser l'espace pour que tout soit plus logique.", points: ["LOGISTIQUE, TRANSPORT ET DISTRIBUTION"] },
            { text: "Imaginer une nouvelle machine plus performante.", points: ["CONCEPTION, CRÉATION ET DESIGN"] },
            { text: "Discuter avec les techniciens pour comprendre leurs besoins.", points: ["COMMERCE, VENTE ET MARKETING"] }
        ]},
        { id: 'Q2', question: "Pour un projet de groupe, tu préfères être celui/celle qui...", answers: [
            { text: "Définit le plan d'action et distribue les tâches.", points: ["MANAGEMENT, GESTION, RH ET STRATÉGIE"] },
            { text: "Se charge de la partie technique la plus complexe.", points: ["MÉCANIQUE ET MAINTENANCE", "INFORMATIQUE ET NUMÉRIQUE"] },
            { text: "Crée la présentation pour la rendre inoubliable.", points: ["CONCEPTION, CRÉATION ET DESIGN", "COMMUNICATION ET ÉVÉNEMENTIEL"] },
            { text: "S'assure que tout le monde s'entend bien et communique.", points: ["SOCIAL, SANTÉ, SOIN ET SERVICES À LA PERSONNE"] }
        ]},
        { id: 'Q3', question: "La matière qui t'intéressait le plus (ou la moins détestable) :", answers: [
            { text: "Les Maths ou la Physique-Chimie.", points: ["MÉCANIQUE ET MAINTENANCE", "INDUSTRIE, PRODUCTION, PROCÉDÉS ET USINAGE"] },
            { text: "L'Économie ou la Gestion.", points: ["MANAGEMENT, GESTION, RH ET STRATÉGIE", "COMMERCE, VENTE ET MARKETING"] },
            { text: "Les Arts Plastiques ou la Philosophie.", points: ["CONCEPTION, CRÉATION ET DESIGN"] },
            { text: "Les SVT ou le Sport.", points: ["AGRICULTURE, VITICULTURE, SYLVICULTURE ET ELEVAGE", "SOCIAL, SANTÉ, SOIN ET SERVICES À LA PERSONNE"] }
        ]},
        { id: 'Q4', question: "Pendant ton temps libre, tu aimes bien...", answers: [
            { text: "Bricoler, réparer des objets, ou bidouiller sur un ordinateur.", points: ["MÉCANIQUE ET MAINTENANCE", "INFORMATIQUE ET NUMÉRIQUE"] },
            { text: "Organiser une sortie ou gérer le budget d'une association.", points: ["MANAGEMENT, GESTION, RH ET STRATÉGIE", "LOGISTIQUE, TRANSPORT ET DISTRIBUTION"] },
            { text: "Dessiner, écrire, faire de la musique, créer quelque chose.", points: ["CONCEPTION, CRÉATION ET DESIGN"] },
            { text: "Participer à des débats ou rencontrer de nouvelles personnes.", points: ["COMMERCE, VENTE ET MARKETING", "COMMUNICATION ET ÉVÉNEMENTIEL"] }
        ]},
        { id: 'Q5', question: "Qu'est-ce qui t'énerve le plus au quotidien ?", answers: [
            { text: "Les choses qui ne sont pas efficaces ou mal organisées.", points: ["LOGISTIQUE, TRANSPORT ET DISTRIBUTION", "MANAGEMENT, GESTION, RH ET STRATÉGIE"] },
            { text: "Un appareil qui tombe en panne et ne pas savoir le réparer.", points: ["MÉCANIQUE ET MAINTENANCE"] },
            { text: "Un design laid ou quelque chose qui manque d'harmonie.", points: ["CONCEPTION, CRÉATION ET DESIGN"] },
            { text: "L'injustice ou le manque de communication entre les gens.", points: ["SOCIAL, SANTÉ, SOIN ET SERVICES À LA PERSONNE", "DROIT ET JUSTICE"] }
        ]}
    ]
};

// --- DÉMARRAGE DE L'APPLICATION ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // J'ai laissé l'ancien nom de fichier ici au cas où, mais tu as raison, il faudra le mettre à jour
        const response = await fetch('./data/database_finale.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        db = await response.json();
        startChat();
    } catch (error) {
        console.error("Erreur fatale : Impossible de charger la base de données.", error);
        addBotMessage("Oups ! Je n'arrive pas à charger les données des formations. Veuillez rafraîchir la page ou vérifier le fichier de données.");
    }
});

function startChat() {
    state = 'START';
    quizScores = {};
    filterCriteria = {};
    chatBox.innerHTML = '';
    userInput.innerHTML = '';
    
    // NOUVEAU : Cacher la carte et détruire l'ancienne instance si elle existe
    if (map) {
        map.remove();
        map = null;
    }
    mapContainer.style.display = 'none';

    addBotMessage("Bonjour ! Je suis ton copilote pour l'orientation. Prêt(e) à trouver ta voie dans le Grand Est ?");
    showChoices([
        { text: "🚀 Commencer le quiz !", nextState: 'QUIZ_Q1' },
        { text: "🔍 J'ai déjà une idée, montre-moi les filtres.", nextState: 'FILTER_CATEGORY' }
    ]);
}

// --- MOTEUR DE CONVERSATION ---
function addBotMessage(text) {
    const message = document.createElement('div');
    message.classList.add('message', 'bot-message');
    message.innerHTML = text;
    chatBox.appendChild(message);
    scrollToBottom();
}

function addUserMessage(text) {
    const message = document.createElement('div');
    message.classList.add('message', 'user-message');
    message.textContent = text;
    chatBox.appendChild(message);
    scrollToBottom();
}

function showChoices(choices) {
    userInput.innerHTML = '';
    choices.forEach(choice => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice.text;
        button.onclick = () => handleChoice(choice);
        userInput.appendChild(button);
    });
}

function handleChoice(choice) {
    if (choice.text) {
        addUserMessage(choice.text);
    }
    
    if (choice.points) {
        choice.points.forEach(category => {
            quizScores[category] = (quizScores[category] || 0) + 1;
        });
    }

    state = choice.nextState;

    if (state.startsWith('QUIZ_Q')) {
        const questionNum = parseInt(state.match(/\d+/)[0], 10);
        if (!isNaN(questionNum) && questionNum > 0 && questionNum <= conversation.quiz.length) {
            askQuizQuestion(questionNum - 1);
        } else {
            showQuizResults();
        }
    } else {
        switch (state) {
            case 'FILTER_CATEGORY':
                askFilterCategory();
                break;
            case 'FILTER_LEVEL':
                if (choice.value) filterCriteria.category = choice.value;
                askFilterLevel();
                break;
            case 'FILTER_LOCATION':
                if (choice.value) filterCriteria.level = choice.value;
                askFilterLocation();
                break;
            case 'SHOW_FILTER_RESULTS':
                if (choice.value) filterCriteria.location = choice.value;
                showFilterResults();
                break;
            case 'RESTART':
                startChat();
                break;
            default:
                addBotMessage("Je suis un peu perdu. Recommençons.");
                startChat();
        }
    }
}

// --- LOGIQUE DU QUIZ ---
function askQuizQuestion(questionIndex) {
    const q = conversation.quiz[questionIndex];
    addBotMessage(q.question);
    const choices = q.answers.map(answer => ({
        text: answer.text,
        nextState: `QUIZ_Q${questionIndex + 2}`,
        points: answer.points
    }));
    showChoices(choices);
}

function showQuizResults() {
    addBotMessage("Quiz terminé ! Voyons ce que ça donne...");

    const sortedScores = Object.entries(quizScores)
        .sort(([, a], [, b]) => b - a);

    if (sortedScores.length < 2) {
        addBotMessage("Je n'ai pas assez d'informations pour te proposer un résultat. Essayons la recherche par filtres !");
        askFilterCategory();
        return;
    }

    const topCategory1 = sortedScores[0][0];
    const topCategory2 = sortedScores[1][0];

    addBotMessage(`D'après tes réponses, les domaines qui semblent te correspondre le plus sont : <b>${topCategory1}</b> et <b>${topCategory2}</b>.`);
    addBotMessage("On explore les formations dans un de ces deux secteurs ?");
    
    showChoices([
        { text: `Explorer "${topCategory1}"`, nextState: 'FILTER_LEVEL', value: topCategory1 },
        { text: `Explorer "${topCategory2}"`, nextState: 'FILTER_LEVEL', value: topCategory2 },
        { text: "Non, choisir un autre domaine", nextState: 'FILTER_CATEGORY' },
        { text: "Refaire le quiz", nextState: 'RESTART' }
    ]);
}

// --- LOGIQUE DES FILTRES ---
function askFilterCategory() {
    addBotMessage("Super ! Quel grand domaine t'intéresse ?");
    const categories = [...new Set(db.map(item => item.categorie))].sort();
    const choices = categories.map(cat => ({
        text: cat,
        nextState: 'FILTER_LEVEL',
        value: cat
    }));
    showChoices(choices);
}

function askFilterLevel() {
    addBotMessage("Très bien. Quel niveau d'études vises-tu ?");
    showChoices([
        { text: "Niveau 3 & 4 (CAP, Bac Pro)", nextState: 'FILTER_LOCATION', value: [3, 4] },
        { text: "Niveau 5 & 6 (Bac+2/3)", nextState: 'FILTER_LOCATION', value: [5, 6] },
        { text: "Niveau 7 et plus (Bac+5)", nextState: 'FILTER_LOCATION', value: [7] },
        { text: "Peu importe, montre-moi tout !", nextState: 'FILTER_LOCATION', value: 'all' }
    ]);
}

function askFilterLocation() {
    addBotMessage("Et pour finir, une préférence géographique ?");
    showChoices([
        { text: "Alsace", nextState: 'SHOW_FILTER_RESULTS', value: 'Alsace' },
        { text: "Lorraine", nextState: 'SHOW_FILTER_RESULTS', value: 'Lorraine' },
        { text: "Champagne-Ardenne", nextState: 'SHOW_FILTER_RESULTS', value: 'Champagne-Ardenne' },
        { text: "Peu importe, je suis mobile !", nextState: 'SHOW_FILTER_RESULTS', value: 'all' }
    ]);
}

// --- AFFICHAGE DES RÉSULTATS ---
function showFilterResults() {
    let results = db.filter(item => {
        const categoryMatch = filterCriteria.category ? (item.categorie === filterCriteria.category) : true;
        const levelMatch = (filterCriteria.level === 'all' || !filterCriteria.level) ? true : (Array.isArray(filterCriteria.level) && filterCriteria.level.includes(item.niveau));
        const locationMatch = (filterCriteria.location === 'all' || !filterCriteria.location) ? true : item.etablissements.some(e => e.region_nom === filterCriteria.location);
        return categoryMatch && levelMatch && locationMatch;
    });

    if (results.length === 0) {
        addBotMessage("Désolé, je n'ai trouvé aucune formation avec ces critères précis. Essayons autre chose !");
    } else {
        addBotMessage(`J'ai trouvé ${results.length} formation(s) qui correspondent à tes critères !`);
        
        // Compter combien d'établissements ont des coordonnées valides
        let hasValidCoordinates = false;
        results.forEach(res => {
            res.etablissements.forEach(etab => {
                if (filterCriteria.location === 'all' || !filterCriteria.location || etab.region_nom === filterCriteria.location) {
                    if (etab.coordonnees && etab.coordonnees.length === 2) {
                        hasValidCoordinates = true;
                    }
                }
            });
        });

        // Si des coordonnées valides existent, afficher la carte
        if (hasValidCoordinates) {
            addBotMessage("Voici les formations sur la carte :");
            mapContainer.style.display = 'block';

            // Détruire l'ancienne carte si elle existe, pour éviter les erreurs
            if (map) {
                map.remove();
            }

            // Coordonnées du centre du Grand Est et niveau de zoom
            map = L.map('map').setView([48.6921, 6.1844], 7);

            // Ajout du fond de carte (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Ajouter un marqueur pour chaque résultat
            results.forEach(res => {
                res.etablissements.forEach(etab => {
                    // Vérifier si l'établissement correspond au filtre de localisation (si un filtre est appliqué)
                    if (filterCriteria.location === 'all' || !filterCriteria.location || etab.region_nom === filterCriteria.location) {
                        // Vérifier si les coordonnées existent et sont valides
                        if (etab.coordonnees && etab.coordonnees.length === 2) {
                            const marker = L.marker(etab.coordonnees).addTo(map);
                            
                            // Créer le contenu du popup
                            const popupContent = `
    <h3>${res.diplome_nom}</h3>
    <p><strong>Niveau:</strong> ${res.niveau}</p>
    <p><strong>Établissement:</strong> ${etab.nom} - ${etab.ville} (${etab.code_postal})</p>
    <p><strong>Portes Ouvertes:</strong> ${etab.jpo_dates || 'Non communiquées'}</p>
    <p>${res.description || 'Pas de description disponible.'}</p>
    <p>
        ${etab.site_web ? `<a href="${etab.site_web}" target="_blank">Site de l'école</a> | ` : ''}
        ${res.lien_formation ? `<a href="${res.lien_formation}" target="_blank">Détails formation</a>` : ''}
    </p>
`;
                            marker.bindPopup(popupContent);
                        }
                    }
                });
            });
        }

        // Afficher toutes les formations dans le chat sous forme de cartes
        results.forEach(res => {
            res.etablissements.forEach(etab => {
                // Vérifier si l'établissement correspond au filtre de localisation
                if (filterCriteria.location === 'all' || !filterCriteria.location || etab.region_nom === filterCriteria.location) {
                    const cardContent = `
                        <div class="result-card">
                            <h3>${res.diplome_nom}</h3>
                            <p><strong>Niveau:</strong> ${res.niveau}</p>
                            <p><strong>Catégorie:</strong> ${res.categorie}</p>
                            <p><strong>Établissement:</strong> ${etab.nom}</p>
                            <p><strong>Ville:</strong> ${etab.ville} (${etab.code_postal}) - ${etab.region_nom}</p>
                            <p><strong>Portes Ouvertes:</strong> ${etab.jpo_dates || 'Non communiquées'}</p>
                            <p>${res.description || 'Pas de description disponible.'}</p>
                            <p>
                                ${etab.site_web ? `<a href="${etab.site_web}" target="_blank">🌐 Site de l'école</a>` : ''}
                                ${etab.site_web && res.lien_formation ? ' | ' : ''}
                                ${res.lien_formation ? `<a href="${res.lien_formation}" target="_blank">📚 Détails formation</a>` : ''}
                            </p>
                        </div>
                    `;
                    addBotMessage(cardContent);
                }
            });
        });
    }

    userInput.innerHTML = '';
    showChoices([{ text: 'Merci ! Faire une nouvelle recherche.', nextState: 'RESTART' }]);
}

// --- FONCTION UTILITAIRE ---
function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}
