// --- Éléments du DOM ---
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

// --- Variables d'état du Chat ---
let state = 'START'; // État actuel de la conversation
let quizAnswers = {}; // Pour stocker les réponses du quiz
let filterCriteria = {}; // Pour stocker les critères de filtre
let db = []; // Pour stocker les données de la base

// --- Base de données de la conversation (Quiz et Filtres) ---
const conversation = {
    quiz: [
        { id: 1, question: "Tu es dans un atelier. Quel est ton premier réflexe ?", answers: [
            { text: "Démonter un moteur pour voir comment ça marche.", points: ["MÉCANIQUE ET MAINTENANCE", "INDUSTRIE, PRODUCTION, PROCÉDÉS ET USINAGE"] },
            { text: "Réorganiser l'espace pour que tout soit plus logique.", points: ["LOGISTIQUE, TRANSPORT ET DISTRIBUTION"] },
            { text: "Imaginer une nouvelle machine qui ferait le travail plus vite.", points: ["CONCEPTION, CRÉATION ET DESIGN"] },
            { text: "Discuter avec les techniciens pour comprendre leurs besoins.", points: ["COMMERCE, VENTE ET MARKETING"] }
        ]},
        // ... (Les autres questions du quiz sont structurées de la même manière)
    ],
    // ... (d'autres éléments de conversation pourraient être ajoutés ici)
};

// --- DÉMARRAGE DE L'APPLICATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Charger la base de données des formations
    try {
        const response = await fetch('./data/database_finale.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        db = await response.json();
        // 2. Démarrer la conversation
        startChat();
    } catch (error) {
        console.error("Erreur fatale : Impossible de charger la base de données.", error);
        addBotMessage("Oups ! Je n'arrive pas à charger les données des formations. Veuillez rafraîchir la page.");
    }
});

function startChat() {
    state = 'START';
    addBotMessage("Bonjour ! Je suis ton copilote pour l'orientation. Prêt(e) à trouver ta voie dans le Grand Est ?");
    showChoices([
        { text: "🚀 Commencer le quiz !", nextState: 'QUIZ_Q1' },
        { text: "🔍 J'ai déjà une idée, montre-moi les filtres.", nextState: 'FILTER_CATEGORY' }
    ]);
}

// --- MOTEUR DE CONVERSATION ---

// Affiche un message du bot
function addBotMessage(text) {
    const message = document.createElement('div');
    message.classList.add('message', 'bot-message');
    message.innerHTML = text; // innerHTML pour permettre les balises comme <br> ou <b>
    chatBox.appendChild(message);
    scrollToBottom();
}

// Affiche un message de l'utilisateur
function addUserMessage(text) {
    const message = document.createElement('div');
    message.classList.add('message', 'user-message');
    message.textContent = text;
    chatBox.appendChild(message);
    scrollToBottom();
}

// Affiche les boutons de choix
function showChoices(choices) {
    userInput.innerHTML = ''; // Nettoyer les anciens boutons
    choices.forEach(choice => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice.text;
        button.onclick = () => handleChoice(choice);
        userInput.appendChild(button);
    });
}

// Gère le clic sur un bouton
function handleChoice(choice) {
    if (choice.text) {
        addUserMessage(choice.text);
    }
    
    // Logique de transition d'état
    state = choice.nextState;
    
    // Appeler la fonction correspondante au nouvel état
    switch (state) {
        case 'QUIZ_Q1':
            askQuizQuestion(0);
            break;
        case 'QUIZ_Q2':
            askQuizQuestion(1);
            break;
        // ... Ajouter les autres cas pour les questions du quiz
        case 'SHOW_QUIZ_RESULTS':
            showQuizResults();
            break;
        case 'FILTER_CATEGORY':
            askFilterCategory();
            break;
        case 'FILTER_LEVEL':
            filterCriteria.category = choice.value;
            askFilterLevel();
            break;
        case 'FILTER_LOCATION':
            filterCriteria.level = choice.value;
            askFilterLocation();
            break;
        case 'SHOW_FILTER_RESULTS':
            filterCriteria.location = choice.value;
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


// --- LOGIQUE DU QUIZ ---

function askQuizQuestion(questionIndex) {
    // Note: Pour une version complète, on aurait les 5 questions dans conversation.quiz
    // Ici, on simule avec une seule question pour la structure.
    const q = conversation.quiz[0]; // On prend la première question comme exemple
    addBotMessage(q.question);
    const choices = q.answers.map(answer => ({
        text: answer.text,
        nextState: 'SHOW_QUIZ_RESULTS', // Pour simplifier, on passe directement aux résultats
        points: answer.points
    }));
    showChoices(choices);
    // Dans une version complète, le nextState serait 'QUIZ_Q' + (questionIndex + 2)
}

function showQuizResults() {
    // Cette fonction devrait calculer les scores et afficher les catégories
    addBotMessage("Quiz terminé ! D'après tes réponses, les domaines qui te correspondent le plus sont la <b>Mécanique</b> et l'<b>Industrie</b>.");
    addBotMessage("On explore les formations dans un de ces deux secteurs ?");
    showChoices([
        { text: "Explorer la Mécanique", nextState: 'FILTER_LEVEL', value: 'MÉCANIQUE ET MAINTENANCE' },
        { text: "Explorer l'Industrie", nextState: 'FILTER_LEVEL', value: 'INDUSTRIE, PRODUCTION, PROCÉDÉS ET USINAGE' },
        { text: "Refaire le quiz", nextState: 'QUIZ_Q1' }
    ]);
}


// --- LOGIQUE DES FILTRES ---

function askFilterCategory() {
    addBotMessage("Super ! Quel grand domaine t'intéresse ?");
    // On extrait les catégories uniques de la base de données
    const categories = [...new Set(db.map(item => item.categorie))];
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
        { text: "Bac+2 / Bac+3", nextState: 'FILTER_LOCATION', value: [5, 6] },
        { text: "Bac+5 et plus", nextState: 'FILTER_LOCATION', value: [7] },
        { text: "CAP / Bac Pro", nextState: 'FILTER_LOCATION', value: [3, 4] },
        { text: "Montre-moi tout !", nextState: 'FILTER_LOCATION', value: 'all' }
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
    addBotMessage("Voici les formations qui correspondent à tes critères :");
    
    let results = db.filter(item => {
        const categoryMatch = item.categorie === filterCriteria.category;
        
        const levelMatch = filterCriteria.level === 'all' || 
                           filterCriteria.level.includes(item.niveau);
                           
        const locationMatch = filterCriteria.location === 'all' || 
                              item.etablissements.some(e => e.region_nom === filterCriteria.location);

        return categoryMatch && levelMatch && locationMatch;
    });

    if (results.length === 0) {
        addBotMessage("Désolé, je n'ai trouvé aucune formation avec ces critères précis. Essayons autre chose !");
    } else {
        results.forEach(res => {
            res.etablissements.forEach(etab => {
                 // On affiche la carte uniquement si l'établissement correspond au filtre de localisation (ou si pas de filtre)
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

    // Proposer de recommencer
    userInput.innerHTML = '';
    showChoices([
        { text: 'Merci ! Recommencer une recherche.', nextState: 'RESTART' }
    ]);
}


// --- FONCTION UTILITAIRE ---
function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}
