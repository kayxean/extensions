chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-controller') {
    // Replace these IDs with the actual IDs of your ad blockers
    const ids = ['nfmlkliedggdodlbgghmmchhgckjoaml', 'ddkjiahejlhfcafbddmgiahcphecmpfh'];

    for (const id of ids) {
      const ext = await chrome.management.get(id);
      await chrome.management.setEnabled(id, !ext.enabled);
      console.log(`${ext.name} is now ${!ext.enabled ? 'enabled' : 'disabled'}`);
    }
  }
});
