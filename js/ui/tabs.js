export function initTabs() {
  const tabBar = document.getElementById('tabBar');
  const tabs = tabBar.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  function activate(tabName) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    panels.forEach(p => p.classList.toggle('active', p.id === `panel-${tabName}`));
  }

  tabBar.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    const name = tab.dataset.tab;
    activate(name);
    history.replaceState(null, '', `#${name}`);
  });

  // Restore from hash
  const hash = location.hash.slice(1);
  if (['news', 'releases', 'papers', 'resources', 'ai-engineer', 'ai-atlas', 'archive'].includes(hash)) {
    activate(hash);
  }
}
