// --- Éléments du DOM ---
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

// --- Variables d'état du Chat ---
let state = 'START';
let quizScores = {};
let filterCriteria = {};
let db = [];

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
        { id: 'Q3', question: "La matière qui t'intéressait le plus (ou le moins détestable) :", answers: [
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
        const response = await fetch('./data/database_finale.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        db = await response.json();
        startChat();
    } catch (error) {
        console.error("Erreur fatale : Impossible de charger la base de données.", error);
        addBotMessage("Oups ! Je n'arrive pas à charger les données des formations. Veuillez rafraîchir la page.");
    }
});

function startChat() {
    state = 'START';
    quizScores = {};
    filterCriteria = {};
    chatBox.innerHTML = '';
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
    
    const quizQuestionMatch = state.match(/QUIZ_Q(\d+)/);
    if (quizQuestionMatch) {
        const questionNum = parseInt(quizQuestionMatch[1], 10);
        askQuizQuestion(questionNum - 1);
    } else {
        switch (state) {
            case 'SHOW_QUIZ_RESULTS':
                showQuizResults();
                break;
            case 'FILTER_CATEGORY':
                askFilterCategory();
                break;
            case 'FILTER_LEVEL':
                // Si on vient des résultats du quiz, la catégorie est pré-remplie
                if (choice.value) filterCriteria.category = choice.value;
                askFilterLevel();
                break;
            case 'FILTER_LOCATION':
                filterCriteria.level = choice.value;
                askFilterLocation();
                break;
            case 'SHOW_FILTER_RESULTS':
                // Si on vient de la sélection de catégorie, on la sauvegarde
                if (choice.category) filterCriteria.category = choice.category;
                 // Si on vient de la sélection de localisation
                if (choice.location) filterCriteria.location = choice.location;
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
    if (questionIndex < conversation.quiz.length) {
        const q = conversation.quiz[questionIndex];
        addBotMessage(q.question);
        const choices = q.answers.map(answer => ({
            text: answer.text,
            nextState: `QUIZ_Q${questionIndex + 2}`,
            points: answer.points
        }));
        showChoices(choices);
    } else {
        handleChoice({ nextState: 'SHOW_QUIZ_RESULTS' });
    }
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
        { text: "CAP / Bac Pro (Niveau 3 & 4)", nextState: 'FILTER_LOCATION', value: [3, 4] },
        { text: "Bac+2 / Bac+3 (Niveau 5 & 6)", nextState: 'FILTER_LOCATION', value: [5, 6] },
        { text: "Bac+5 et plus (Niveau 7)", nextState: 'FILTER_LOCATION', value: [7] },
        { text: "Peu importe, montre-moi tout !", nextState: 'FILTER_LOCATION', value: 'all' }
    ]);
}

function askFilterLocation() {
    addBotMessage("Et pour finir, une préférence géographique ?");
    showChoices([
        { text: "Alsace", nextState: 'SHOW_FILTER_RESULTS', location: 'Alsace' },
        { text: "Lorraine", nextState: 'SHOW_FILTER_RESULTS', location: 'Lorraine' },
        { text: "Champagne-Ardenne", nextState: 'SHOW_FILTER_RESULTS', location: 'Champagne-Ardenne' },
        { text: "Peu importe, je suis mobile !", nextState: 'SHOW_FILTER_RESULTS', location: 'all' }
    ]);
}

// --- AFFICHAGE DES RÉSULTATS ---
function showFilterResults() {
    addBotMessage("Voici les formations qui correspondent à tes critères :");
    
    let results = db.filter(item => {
        const categoryMatch = item.categorie === filterCriteria.category;
        const levelMatch = filterCriteria.level === 'all' || (Array.isArray(filterCriteria.level) && filterCriteria.level.includes(item.niveau));
        const locationMatch = filterCriteria.location === 'all' || item.etablissements.some(e => e.region_nom === filterCriteria.location);
        return categoryMatch && levelMatch && locationMatch;
    });

    if (results.length === 0) {
        addBotMessage("Désolé, je n'ai trouvé aucune formation avec ces critères précis. Essayons autre chose !");
    } else {
        results.forEach(res => {
            res.etablissements.forEach(etab => {
                if (filterCriteria.location === 'all' || etab.region_nom === filterCriteria.location) {
                    const card = `
                        <div class="result-card">
                            <h3>${res.diplome_nom} (${res.diplome_acronyme})</h3>
                            <p><strong>🎓 Niveau :</strong> ${res.niveau}</p>
                            <p><strong>📍 Établissement :</strong> ${etab.nom}, ${etab.ville}</p>
                            <p><strong>🗓️ JPO :</strong> ${etab.jpo_dates}</p>
                            <p>
                                <a href="${etab.site_web}" target="_blank">Site de l'école</a> | 
                                <a href="${etab.lien_formation}" target="_blank">Page de la formation</a>
                            </p>
                        </div>
                    `;
                    addBotMessage(card);
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
