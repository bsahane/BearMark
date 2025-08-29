// Initialize Chrome storage before app loads
console.log('🔧 Initializing Chrome storage...');
try {
    window.bearmarkDB = new ChromeStorageDB();
    window.bearmarkDB.init().then(() => {
        console.log('✅ Chrome storage ready');
    }).catch(error => {
        console.error('❌ Chrome storage failed to initialize:', error);
    });
} catch (error) {
    console.error('💥 Error creating Chrome storage:', error);
}
