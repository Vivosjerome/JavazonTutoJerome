document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------------
    // SÉLECTION DES ÉLÉMENTS
    // ----------------------------------------------------------------
    const actButtons = document.querySelectorAll('.act-btn[data-act]'); // SÉLECTIONNE SEULEMENT les boutons D'ACTE
    const actContents = document.querySelectorAll('.act-content');
    const allCheckboxes = document.querySelectorAll('.step-checkbox');
    const toggleButton = document.getElementById('toggle-hide-completed');
    
    // État du filtre : true = Cacher les étapes terminées
    let hideCompleted = localStorage.getItem('hideCompleted') === 'true'; 

    
    // ----------------------------------------------------------------
    // FONCTIONS COMMUNES
    // ----------------------------------------------------------------
    
    /**
     * Calcule si toutes les étapes d'un Acte donné sont cochées
     * et met à jour l'état du bouton d'Acte.
     * @param {string} actNumber - Le numéro de l'Acte (ex: '1').
     */
    const checkActCompletion = (actNumber) => {
        const actContent = document.getElementById(`act-${actNumber}-content`);
        if (!actContent) return;

        // Toutes les checkboxes de cet Acte
        const checkboxesInAct = actContent.querySelectorAll('.step-checkbox');
        // Filtre celles qui sont cochées
        const checkedCount = Array.from(checkboxesInAct).filter(cb => cb.checked).length;
        
        const isCompleted = checkboxesInAct.length > 0 && checkedCount === checkboxesInAct.length;
        
        // Trouver le bouton d'Acte correspondant
        const actButton = document.querySelector(`.act-btn[data-act="${actNumber}"]`);
        
        if (actButton) {
            if (isCompleted) {
                actButton.classList.add('completed-act');
                localStorage.setItem(`act_${actNumber}_completed`, 'true');
            } else {
                actButton.classList.remove('completed-act');
                localStorage.setItem(`act_${actNumber}_completed`, 'false');
            }
        }
    };
    
    /**
     * Réinitialise toutes les étapes d'un Acte donné.
     * @param {string} actNumber - Le numéro de l'Acte (ex: '1').
     */
    const resetAct = (actNumber) => {
        const actContent = document.getElementById(`act-${actNumber}-content`);
        if (!actContent) return;

        actContent.querySelectorAll('.step-checkbox').forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                // Retire la classe de complétion (style et masquage)
                toggleStepStyleAndVisibility(checkbox); 
                // Sauvegarde l'état non coché
                saveStepState(checkbox); 
            }
        });
        
        // Met à jour l'état du bouton d'Acte (enlève le gris)
        checkActCompletion(actNumber);
    };


    // ----------------------------------------------------------------
    // 1. Fonctionnalité de changement d'Acte
    // ----------------------------------------------------------------

    const showAct = (targetAct) => {
        actContents.forEach(content => {
            content.style.display = 'none';
        });

        const targetElement = document.getElementById(`act-${targetAct}-content`);
        if (targetElement) {
            targetElement.style.display = 'block';
            
            // Nouveau : Ajoute le bouton "Recommencer" dans le contenu de l'Acte
            const existingResetButton = targetElement.querySelector('.reset-act-btn');
            if (!existingResetButton) {
                const resetButton = document.createElement('button');
                resetButton.className = 'act-btn reset-act-btn';
                resetButton.textContent = `Réinitialiser Acte ${targetAct}`;
                resetButton.style.marginBottom = '20px';
                resetButton.style.display = 'block';
                resetButton.style.margin = '0 auto 20px auto';
                resetButton.addEventListener('click', () => {
                    if (confirm(`Êtes-vous sûr de vouloir réinitialiser toutes les étapes de l'Acte ${targetAct} ?`)) {
                        resetAct(targetAct);
                    }
                });
                targetElement.prepend(resetButton);
            }
        }
    };
    
    // ... (Le reste de la Section 1) ...
    actButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetAct = button.getAttribute('data-act');
            if (targetAct) {
                showAct(targetAct);
            }
        });
    });

    // ----------------------------------------------------------------
    // 2. Logique de Suivi, Sauvegarde et Filtrage (Mise à jour)
    // ----------------------------------------------------------------
    
    const toggleStepStyleAndVisibility = (checkbox) => {
        const listItem = checkbox.closest('li');
        
        if (checkbox.checked) {
            listItem.classList.add('completed-step');
            
            if (hideCompleted) { 
                listItem.classList.add('hidden-step'); 
            }
        } else {
            listItem.classList.remove('completed-step');
            listItem.classList.remove('hidden-step'); 
        }
        
        // NOUVEAU : Vérifie l'état de complétion de l'Acte après chaque clic
        const actNumber = listItem.getAttribute('data-act');
        if (actNumber) {
            checkActCompletion(actNumber);
        }
    };
    
    // ... (Les fonctions applyFilter et saveStepState restent inchangées) ...

    const applyFilter = () => {
        const completedSteps = document.querySelectorAll('.completed-step');
        
        completedSteps.forEach(step => {
            if (hideCompleted) {
                step.classList.add('hidden-step');
            } else {
                step.classList.remove('hidden-step');
            }
        });
        
        toggleButton.textContent = hideCompleted 
            ? 'Afficher les étapes terminées' 
            : 'Cacher les étapes terminées';
            
        localStorage.setItem('hideCompleted', hideCompleted);
    };

    const saveStepState = (checkbox) => {
        const listItem = checkbox.closest('li');
        const act = listItem.getAttribute('data-act');
        const step = listItem.getAttribute('data-step');
        const key = `poe_guide_act_${act}_step_${step}`; 
        
        localStorage.setItem(key, checkbox.checked ? 'completed' : 'pending');
    };


    /**
     * Charge l'état de toutes les étapes et l'état des boutons d'Acte.
     */
    const loadStepStates = () => {
        const actNumbers = Array.from(actButtons).map(btn => btn.getAttribute('data-act'));
        
        allCheckboxes.forEach(checkbox => {
            const listItem = checkbox.closest('li');
            const act = listItem.getAttribute('data-act');
            const step = listItem.getAttribute('data-step');
            const key = `poe_guide_act_${act}_step_${step}`;
            
            if (localStorage.getItem(key) === 'completed') {
                checkbox.checked = true; 
                toggleStepStyleAndVisibility(checkbox); 
            }
        });
        
        // Après le chargement de toutes les étapes, vérifiez l'état de complétion de chaque Acte
        actNumbers.forEach(checkActCompletion);
        
        applyFilter(); 
    };
    
    // ----------------------------------------------------------------
    // Événements et Initialisation
    // ----------------------------------------------------------------

    // 1. Événement pour le changement de case à cocher (utilise la fonction mise à jour)
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            toggleStepStyleAndVisibility(e.target); 
            saveStepState(e.target);
        });
    });

    // 2. Événement pour le bouton de filtre
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            hideCompleted = !hideCompleted; 
            applyFilter(); 
        });
    }

    // Initialisation
    loadStepStates();
    showAct('1'); // Affiche l'Acte 1 par défaut
});