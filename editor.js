// Fonctions pour l'éditeur de notes
let saveTimeout;
let lastSavedContent = '';
let lastSavedTitle = '';
let selectedCategory = '';

function applyFormat(format) {
    const editor = document.getElementById('noteContent');
    const sel = window.getSelection();
    
    if (!sel.rangeCount || sel.isCollapsed) {
        alert('Veuillez sélectionner du texte d\'abord');
        return;
    }
    
    const range = sel.getRangeAt(0);
    const selectedText = range.toString();
    
    let element;
    switch(format) {
        case 'gras':
            element = document.createElement('strong');
            break;
        case 'sousligné':
            element = document.createElement('u');
            break;
        case 'titre':
            element = document.createElement('h1');
            element.className = 'note-titre';
            break;
        case 'soustitre':
            element = document.createElement('h2');
            element.className = 'note-soustitre';
            break;
        default:
            return;
    }
    
    element.textContent = selectedText;
    
    // Insérer l'élément formaté
    try {
        range.deleteContents();
        range.insertNode(element);
        
        // Placer le curseur après l'élément
        range.setStartAfter(element);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    } catch (e) {
        console.error('Erreur lors du formatage:', e);
    }
    
    // Sauvegarder après formatage
    setTimeout(autoSave, 100);
    
    editor.focus();
}

function handleSlashCommands(editor) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    let node = range.startContainer;
    
    // Ne traiter que les text nodes
    if (node.nodeType !== 3) return;
    
    let textContent = node.textContent;
    let offset = range.startOffset;
    
    // Récupérer le texte du début jusqu'au curseur
    const textBeforeCursor = textContent.substring(0, offset);
    
    // Chercher une commande slash (ex: "/titre", "/soustitre", etc.)
    const slashMatch = textBeforeCursor.match(/^(.*?)(\/(\w+)\s+(.*)?)$/);
    
    if (!slashMatch) return;
    
    const beforeSlash = slashMatch[1];
    const command = slashMatch[3].toLowerCase();
    const textAfterCommand = slashMatch[4];
    
    const commands = {
        'titre': 'titre',
        'soustitre': 'soustitre',
        'sousligné': 'sousligné',
        'gras': 'gras'
    };
    
    if (!commands[command]) return;
    
    // Créer l'élément formaté
    let element;
    switch(command) {
        case 'titre':
            element = document.createElement('h1');
            element.className = 'note-titre';
            break;
        case 'soustitre':
            element = document.createElement('h2');
            element.className = 'note-soustitre';
            break;
        case 'gras':
            element = document.createElement('strong');
            break;
        case 'sousligné':
            element = document.createElement('u');
            break;
        default:
            return;
    }
    
    element.textContent = textAfterCommand;
    
    // Remplacer le nœud texte
    try {
        // Créer le nouveau contenu
        const newContent = beforeSlash + element.outerHTML;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newContent;
        
        // Remplacer le nœud
        const parent = node.parentNode;
        while (tempDiv.firstChild) {
            parent.insertBefore(tempDiv.firstChild, node);
        }
        parent.removeChild(node);
        
        autoSave();
    } catch (e) {
        console.error('Erreur lors du traitement de la commande:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('noteContent');
    const titleInput = document.getElementById('noteTitle');
    
    // Récupérer la catégorie depuis l'URL
    const params = new URLSearchParams(window.location.search);
    selectedCategory = params.get('category') || 'Sans catégorie';
    
    // Permettre le drag-drop d'images
    editor.addEventListener('dragover', (e) => {
        e.preventDefault();
        editor.style.backgroundColor = '#2a2a2a';
    });
    editor.addEventListener('dragleave', () => {
        editor.style.backgroundColor = 'transparent';
    });
    editor.addEventListener('drop', (e) => {
        e.preventDefault();
        editor.style.backgroundColor = 'transparent';
        handleDroppedFiles(e.dataTransfer.files);
    });
    
    // Gestion des clics pour placer le curseur après les images
    editor.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            // Clic sur l'image - placer le curseur après
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStartAfter(e.target);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    });
    
    // Gestion des commandes slash
    editor.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            setTimeout(() => {
                handleSlashCommands(editor);
            }, 0);
        }
    });
    
    // Gestion de la touche Entrée pour créer une nouvelle ligne après les images
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const node = range.endContainer;
                
                // Vérifier si le curseur est immédiatement après une image
                const prevNode = node.previousSibling || (node.parentNode && node.parentNode.previousSibling);
                if (prevNode && (prevNode.tagName === 'IMG' || prevNode.className === 'image-container')) {
                    e.preventDefault();
                    
                    // Créer un div avec clear:left pour forcer le texte en dessous
                    const div = document.createElement('div');
                    div.style.clear = 'left';
                    
                    range.insertNode(div);
                    
                    // Placer le curseur au début du nouveau div
                    range.setStart(div, 0);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }
    });
    
    // Sauvegarde automatique au changement du titre
    titleInput.addEventListener('input', () => {
        autoSave();
    });
    
    // Sauvegarde automatique au changement du contenu
    editor.addEventListener('input', () => {
        autoSave();
    });
    
    editor.addEventListener('paste', () => {
        setTimeout(autoSave, 100);
    });
});

function handleDroppedFiles(files) {
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            insertImage(file);
        }
    }
}

function insertImage(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const editor = document.getElementById('noteContent');
        
        // Créer un conteneur pour l'image
        const imgContainer = document.createElement('span');
        imgContainer.className = 'image-container';
        imgContainer.contentEditable = 'false';
        
        const img = document.createElement('img');
        img.src = event.target.result;
        img.className = 'note-image';
        
        imgContainer.appendChild(img);
        
        // Insérer le conteneur d'image
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.insertNode(imgContainer);
            
            // Placer le curseur après l'image
            range.setStartAfter(imgContainer);
            range.setEndAfter(imgContainer);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            editor.appendChild(imgContainer);
        }
        
        // Focus sur l'éditeur
        editor.focus();
    };
    reader.readAsDataURL(file);
}

function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const editor = document.getElementById('noteContent');
    
    if (!title) {
        return false;
    }

    if (!editor.textContent.trim() && editor.querySelectorAll('img').length === 0) {
        return false;
    }

    // Récupérer les notes depuis le localStorage
    let notes = JSON.parse(localStorage.getItem('notes')) || [];

    // Créer la nouvelle note avec catégorie
    const newNote = {
        id: Date.now(),
        title: title,
        category: selectedCategory,
        content: editor.innerHTML,
        date: new Date().toLocaleDateString('fr-FR')
    };

    // Ajouter la note
    notes.unshift(newNote);

    // Sauvegarder dans localStorage
    localStorage.setItem('notes', JSON.stringify(notes));
    
    lastSavedTitle = title;
    lastSavedContent = editor.innerHTML;
    
    return true;
}

function autoSave() {
    const title = document.getElementById('noteTitle').value.trim();
    const editor = document.getElementById('noteContent');
    const saveStatus = document.getElementById('saveStatus');
    
    // Réinitialiser le timeout
    clearTimeout(saveTimeout);
    
    // Afficher "Enregistrement..."
    saveStatus.textContent = '⏳ Enregistrement...';
    saveStatus.classList.remove('saved', 'error');
    
    // Sauvegarder après 1 seconde d'inactivité
    saveTimeout = setTimeout(() => {
        if (title && (editor.textContent.trim() || editor.querySelectorAll('img').length > 0)) {
            const success = saveNote();
            
            if (success) {
                saveStatus.textContent = '✓ Sauvegardé';
                saveStatus.classList.add('saved');
                
                // Retirer l'indicateur après 2 secondes
                setTimeout(() => {
                    saveStatus.textContent = '';
                    saveStatus.classList.remove('saved');
                }, 2000);
            }
        }
    }, 1000);
}

function goHome() {
    window.location.href = 'accueil.html';
}
