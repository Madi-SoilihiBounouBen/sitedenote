// Charger et afficher les catégories
document.addEventListener('DOMContentLoaded', () => {
    loadCategoriesToSelect();
    
    // Permettre créer une catégorie en appuyant sur Entrée
    document.getElementById('newCategoryInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createAndGoToNote();
        }
    });
});

function loadCategoriesToSelect() {
    const categories = JSON.parse(localStorage.getItem('categories')) || [];
    const list = document.getElementById('categoriesList');
    
    if (categories.length === 0) {
        list.innerHTML = '<p class="no-categories">Aucune catégorie créée. Créez la première ci-dessous.</p>';
        return;
    }
    
    list.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="goToNote('${cat}')">
            <div class="category-icon">📁</div>
            <div class="category-name">${cat}</div>
        </div>
    `).join('');
}

function goToNote(categoryName) {
    window.location.href = `note.html?category=${encodeURIComponent(categoryName)}`;
}

function createAndGoToNote() {
    const categoryInput = document.getElementById('newCategoryInput');
    const categoryName = categoryInput.value.trim();
    
    if (!categoryName) {
        alert('Veuillez entrer un nom de catégorie');
        return;
    }
    
    // Ajouter la catégorie
    let categories = JSON.parse(localStorage.getItem('categories')) || [];
    
    if (!categories.includes(categoryName)) {
        categories.push(categoryName);
        localStorage.setItem('categories', JSON.stringify(categories));
    }
    
    // Aller à l'éditeur avec cette catégorie
    goToNote(categoryName);
}

function goHome() {
    window.location.href = 'accueil.html';
}
