// Données d'exemple
let notes = [
    {
        id: 1,
        title: "Bienvenue dans Kiritassi",
        content: "Ceci est votre première note. Commencez à créer vos propres notes en cliquant sur le bouton +",
        date: new Date().toLocaleDateString('fr-FR')
    },
    {
        id: 2,
        title: "Liste de courses",
        content: "Pain, lait, œufs, fromage, tomates",
        date: new Date(Date.now() - 86400000).toLocaleDateString('fr-FR')
    },
    {
        id: 3,
        title: "Idées de projet",
        content: "Développer une application de gestion de tâches avec notifications",
        date: new Date(Date.now() - 172800000).toLocaleDateString('fr-FR')
    }
];

function renderNotes(notesToRender = notes) {
    const container = document.getElementById('notesContainer');
    
    if (notesToRender.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>Aucune note</h3>
                <p>Créez votre première note pour commencer</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notesToRender.map(note => {
        // Extraire le texte brut du contenu HTML
        const temp = document.createElement('div');
        temp.innerHTML = note.content;
        const textContent = temp.textContent || temp.innerText || '';
        
        // Créer un aperçu du contenu
        const preview = textContent.substring(0, 150).trim();
        const previewText = preview + (textContent.length > 150 ? '...' : '');
        
        // Afficher la catégorie si elle existe
        const category = note.category ? `<div class="note-category">${note.category}</div>` : '';
        
        return `
            <div class="note-card" onclick="openNote(${note.id})">
                ${category}
                <div class="note-title">${note.title}</div>
                <div class="note-preview">${previewText}</div>
                <div class="note-date">${note.date}</div>
            </div>
        `;
    }).join('');
}

function switchView(view) {
    const items = document.querySelectorAll('nav ul li');
    items.forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');

    const titles = {
        'all': 'Toutes les notes',
        'recent': 'Notes récentes',
        'new': 'Nouvelle note',
        'tasks': 'Tâches'
    };

    document.getElementById('viewTitle').textContent = titles[view];

    if (view === 'new') {
        createNewNote();
    } else {
        renderNotes();
    }
}

function createNewNote() {
    window.location.href = 'categorie.html';
}

function openNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        alert(`${note.title}\n\n${note.content}\n\nDate: ${note.date}`);
    }
}

// Recherche
document.getElementById('searchBar').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) || 
        note.content.toLowerCase().includes(searchTerm)
    );
    renderNotes(filtered);
});

// Initialisation
renderNotes();