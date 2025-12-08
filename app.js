// ... (Gardez le début du fichier) ...

    function showFormations(formations) {
        // 1. Création d'un conteneur grille
        const gridContainer = document.createElement('div');
        gridContainer.className = 'results-grid'; // La classe CSS que nous avons créée

        formations.forEach(f => {
            // Construction des boutons URL
            let buttonsHtml = '';
            
            if (f.URL_Page_Formation && f.URL_Page_Formation.length > 5) {
                buttonsHtml += `<a href="${f.URL_Page_Formation}" target="_blank" class="formation-link primary">Voir la fiche</a>`;
            }
            if (f.URL_Site_Etablissement && f.URL_Site_Etablissement.length > 5) {
                buttonsHtml += `<a href="${f.URL_Site_Etablissement}" target="_blank" class="formation-link secondary">Site école</a>`;
            }

            // Gestion de la date de portes ouvertes
            let dateHtml = '';
            if (f.Dates_Portes_Ouvertes && f.Dates_Portes_Ouvertes.length > 2) {
                dateHtml = `<div class="formation-date">📅 JPO : ${f.Dates_Portes_Ouvertes}</div>`;
            }

            // Création de l'élément carte (DOM element au lieu de string HTML pure pour plus de propreté ici)
            const card = document.createElement('div');
            card.className = 'formation-card';
            card.innerHTML = `
                <span class="formation-title">${f.Nom_Complet_Diplome}</span>
                <div class="formation-school">🏫 ${f.Nom_Etablissement}</div>
                
                <div class="formation-details">
                    <span class="tag">📍 ${f.Ville}</span>
                    <span class="tag">${f.Acronyme_Diplome}</span>
                    <span class="tag level">Niv ${f.Niveau_Europeen}</span>
                </div>

                ${dateHtml}

                ${buttonsHtml ? `<div class="formation-actions">${buttonsHtml}</div>` : ''}
            `;
            
            // Ajout de la carte à la grille
            gridContainer.appendChild(card);
        });

        // 2. On ajoute la grille complète dans le conteneur de messages
        // Note: On ne l'enveloppe PAS dans une bulle "bot-message" grise classique, 
        // car c'est une grille de résultats visuelle.
        messagesContainer.appendChild(gridContainer);
        scrollToBottom();
    }

// ... (Gardez le reste du fichier) ...
