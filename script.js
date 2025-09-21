let activities = [];
let currentFilter = 'pending';
let currentPhotos = [];
let currentModalPhotos = [];
let currentPhotoIndex = 0;

// Charger les activités au démarrage
loadActivities();

// Ouvrir le modal d'ajout d'activité
function openAddModal() {
    document.getElementById('addActivityModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Empêcher le scroll
}

// Fermer le modal d'ajout d'activité
function closeAddModal() {
    document.getElementById('addActivityModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Rétablir le scroll
    
    // Réinitialiser le formulaire
    document.getElementById('activityTitle').value = '';
    document.getElementById('activityDescription').value = '';
    document.getElementById('activityAuthor').value = '';
    document.getElementById('activityDate').value = '';
    document.getElementById('activityPhotos').value = '';
    document.getElementById('photoPreview').innerHTML = '';
    currentPhotos = [];
}

// Fermer le modal en cliquant à côté
document.getElementById('addActivityModal').onclick = function(e) {
    if (e.target === this) {
        closeAddModal();
    }
};

// Fermer le modal avec Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const addModal = document.getElementById('addActivityModal');
        const photoModal = document.getElementById('photoModal');
        
        if (addModal.style.display === 'block') {
            closeAddModal();
        } else if (photoModal.style.display === 'block') {
            closePhotoModal();
        }
    }
});

// Gestion des photos lors de la sélection
document.getElementById('activityPhotos').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    currentPhotos = [];
    
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = '';
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoData = e.target.result;
                currentPhotos.push(photoData);
                
                const img = document.createElement('img');
                img.src = photoData;
                img.onclick = () => openPhotoModal([photoData], 0);
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
});

function addActivity() {
    const title = document.getElementById('activityTitle').value.trim();
    const description = document.getElementById('activityDescription').value.trim();
    const author = document.getElementById('activityAuthor').value.trim();
    const date = document.getElementById('activityDate').value;

    if (!title) {
        alert('Le nom de l\'activité est obligatoire !');
        return;
    }

    const activity = {
        id: Date.now(),
        title,
        description,
        author: author || 'Anonyme',
        date,
        completed: false,
        createdAt: new Date().toISOString(),
        photos: [...currentPhotos]
    };

    activities.unshift(activity);
    saveActivities();
    renderActivities();
    updateStats();

    // Fermer le modal
    closeAddModal();
}

function addPhotoToActivity(activityId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        const activity = activities.find(a => a.id === activityId);
        
        if (!activity) return;
        if (!activity.photos) activity.photos = [];
        
        let processed = 0;
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    activity.photos.push(e.target.result);
                    processed++;
                    
                    if (processed === files.length) {
                        saveActivities();
                        renderActivities();
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    };
    
    input.click();
}

function openPhotoModal(photos, index) {
    currentModalPhotos = photos;
    currentPhotoIndex = index;
    
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalImage');
    
    modal.style.display = 'block';
    modalImg.src = photos[index];
    
    // Cacher les flèches si une seule photo
    const prevBtn = document.querySelector('.photo-nav.prev');
    const nextBtn = document.querySelector('.photo-nav.next');
    
    if (photos.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
    }
}

function closePhotoModal() {
    document.getElementById('photoModal').style.display = 'none';
}

function prevPhoto() {
    if (currentPhotoIndex > 0) {
        currentPhotoIndex--;
    } else {
        currentPhotoIndex = currentModalPhotos.length - 1;
    }
    document.getElementById('modalImage').src = currentModalPhotos[currentPhotoIndex];
}

function nextPhoto() {
    if (currentPhotoIndex < currentModalPhotos.length - 1) {
        currentPhotoIndex++;
    } else {
        currentPhotoIndex = 0;
    }
    document.getElementById('modalImage').src = currentModalPhotos[currentPhotoIndex];
}

// Fermer la modal photo en cliquant à côté
document.getElementById('photoModal').onclick = function(e) {
    if (e.target === this) {
        closePhotoModal();
    }
};

// Navigation clavier dans la modal photo
document.addEventListener('keydown', function(e) {
    const photoModal = document.getElementById('photoModal');
    if (photoModal.style.display === 'block') {
        if (e.key === 'ArrowLeft') {
            prevPhoto();
        } else if (e.key === 'ArrowRight') {
            nextPhoto();
        }
    }
});

function toggleDateEdit(activityId) {
    const editDiv = document.getElementById(`dateEdit${activityId}`);
    const isCurrentlyActive = editDiv.classList.contains('active');
    
    // Fermer tous les autres éditeurs de date ouverts
    document.querySelectorAll('.inline-date-edit.active').forEach(div => {
        div.classList.remove('active');
    });
    
    // Toggle l'éditeur actuel
    if (!isCurrentlyActive) {
        editDiv.classList.add('active');
        // Focus sur l'input de date
        document.getElementById(`newDate${activityId}`).focus();
    }
}

function saveDate(activityId) {
    const newDateInput = document.getElementById(`newDate${activityId}`);
    const newDate = newDateInput.value;
    
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
        activity.date = newDate;
        saveActivities();
        renderActivities();
        updateStats();
    }
}

function clearDate(activityId) {
    const activity = activities.find(a => a.id === activityId);
    if (activity) {
        activity.date = '';
        saveActivities();
        renderActivities();
        updateStats();
    }
}

function cancelDateEdit(activityId) {
    const editDiv = document.getElementById(`dateEdit${activityId}`);
    const activity = activities.find(a => a.id === activityId);
    
    // Remettre la date originale dans l'input
    if (activity) {
        document.getElementById(`newDate${activityId}`).value = activity.date;
    }
    
    // Fermer l'éditeur
    editDiv.classList.remove('active');
}

function toggleComplete(id) {
    const activity = activities.find(a => a.id === id);
    if (activity) {
        activity.completed = !activity.completed;
        saveActivities();
        renderActivities();
        updateStats();
    }
}

function deleteActivity(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
        activities = activities.filter(a => a.id !== id);
        saveActivities();
        renderActivities();
        updateStats();
    }
}

function filterActivities(filter) {
    currentFilter = filter;
    
    // Mettre à jour l'apparence des boutons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderActivities();
}

function renderActivities() {
    const container = document.getElementById('activitiesList');
    
    let filteredActivities = activities;
    
    switch (currentFilter) {
        case 'pending':
            filteredActivities = activities.filter(a => !a.completed);
            break;
        case 'completed':
            filteredActivities = activities.filter(a => a.completed);
            break;
    }

    if (filteredActivities.length === 0) {
        const message = currentFilter === 'pending' 
            ? 'Aucune activité à faire pour le moment ! 🎉' 
            : 'Aucune activité terminée pour le moment 📝';
        container.innerHTML = `<div class="no-activities">${message}</div>`;
        return;
    }

    container.innerHTML = filteredActivities.map(activity => {
        const dateDisplay = activity.date 
            ? `<div class="activity-date">${formatDate(activity.date)}</div>`
            : `<div class="activity-date no-date">Pas de date fixée</div>`;

        const photosDisplay = activity.photos && activity.photos.length > 0
            ? `<div class="activity-photos">
                ${activity.photos.slice(0, 4).map((photo, index) => 
                    `<div class="activity-photo" onclick="openPhotoModal(${JSON.stringify(activity.photos).replace(/"/g, '&quot;')}, ${index})">
                        <img src="${photo}" alt="Photo souvenir">
                    </div>`
                ).join('')}
                ${activity.photos.length > 4 ? 
                    `<div class="activity-photo" onclick="openPhotoModal(${JSON.stringify(activity.photos).replace(/"/g, '&quot;')}, 4)">
                        <img src="${activity.photos[4]}" alt="Photo souvenir" style="filter: brightness(0.5);">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: bold;">+${activity.photos.length - 4}</div>
                    </div>` : ''
                }
            </div>` : '';

        const photoCount = activity.photos && activity.photos.length > 0 
            ? `<span class="photo-count">${activity.photos.length} photo${activity.photos.length > 1 ? 's' : ''}</span>`
            : '';

        return `
            <div class="activity-card ${activity.completed ? 'completed' : ''}">
                <div class="activity-header">
                    <div>
                        <div class="activity-title">${escapeHtml(activity.title)} ${photoCount}</div>
                        <div class="activity-author">Proposé par ${escapeHtml(activity.author)}</div>
                    </div>
                </div>
                
                ${activity.description ? `<div class="activity-description">${escapeHtml(activity.description)}</div>` : ''}
                
                ${photosDisplay}
                
                <div class="activity-meta">
                    ${dateDisplay}
                    <div class="activity-actions" style="flex-wrap: wrap;">
                        <button class="btn-complete" onclick="toggleComplete(${activity.id})">
                            ${activity.completed ? '↶ Annuler' : '✓ Terminé'}
                        </button>
                        <button class="btn-edit-date" onclick="toggleDateEdit(${activity.id})">
                            📅 Modifier date
                        </button>
                        <button class="add-photo-to-activity" onclick="addPhotoToActivity(${activity.id})">
                            📷 Ajouter photos
                        </button>
                        <button class="btn-delete" onclick="deleteActivity(${activity.id})">
                            🗑️ Supprimer
                        </button>
                    </div>
                </div>
                
                <div id="dateEdit${activity.id}" class="inline-date-edit">
                    <label style="color: #333; margin-bottom: 10px; display: block;">Nouvelle date :</label>
                    <input type="date" id="newDate${activity.id}" value="${activity.date}" style="margin-bottom: 10px;">
                    <div class="date-edit-controls">
                        <button class="btn-save-date" onclick="saveDate(${activity.id})">✓ Enregistrer</button>
                        <button class="btn-cancel-date" onclick="cancelDateEdit(${activity.id})">✖ Annuler</button>
                        <button class="btn-cancel-date" onclick="clearDate(${activity.id})">🗑️ Supprimer date</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateStats() {
    const total = activities.length;
    const completed = activities.filter(a => a.completed).length;
    const pending = total - completed;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pendingCount').textContent = pending;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveActivities() {
    // Utilisation d'une variable globale pour simuler la persistence
    // En production, vous pourriez utiliser une base de données
    window.activitiesData = activities;
}

function loadActivities() {
    // Charger les données sauvegardées
    if (window.activitiesData) {
        activities = window.activitiesData;
    } else {
        // Ajouter quelques activités d'exemple au premier chargement
        activities = [
            {
                id: 1,
                title: "Soirée pizza et jeux de société",
                description: "On se retrouve chez Marie pour une soirée détente avec de la pizza et nos jeux préférés",
                author: "Marie",
                date: "2025-10-15",
                completed: false,
                createdAt: new Date().toISOString(),
                photos: []
            },
            {
                id: 2,
                title: "Randonnée en forêt",
                description: "Balade dans les bois de Vincennes, prévoir des baskets !",
                author: "Thomas",
                date: "",
                completed: true,
                createdAt: new Date().toISOString(),
                photos: []
            }
        ];
    }
    renderActivities();
    updateStats();
}

// Gestion des touches pour ajouter rapidement une activité
document.addEventListener('keydown', function(e) {
    const addModal = document.getElementById('addActivityModal');
    
    if (addModal.style.display === 'block' && e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;
        
        // Si on n'est pas dans le textarea, ajouter l'activité
        if (activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            addActivity();
        }
    }
    
    // Échap pour fermer l'édition de date
    if (e.key === 'Escape') {
        document.querySelectorAll('.inline-date-edit.active').forEach(div => {
            div.classList.remove('active');
        });
    }
});

// Fermer l'édition de date en cliquant ailleurs
document.addEventListener('click', function(e) {
    // Vérifier si le clic n'est pas dans un éditeur de date ou sur un bouton de modification de date
    if (!e.target.closest('.inline-date-edit') && !e.target.closest('.btn-edit-date')) {
        document.querySelectorAll('.inline-date-edit.active').forEach(div => {
            div.classList.remove('active');
        });
    }
});