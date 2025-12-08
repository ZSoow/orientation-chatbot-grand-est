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
