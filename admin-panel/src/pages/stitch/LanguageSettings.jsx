import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LanguageSettings() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
  ];

  const handleSave = () => {
    window.alert('Language preferences updated!');
    navigate('/profile');
  };

  return (
    <div className="bg-surface min-h-screen pb-safe">
      <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 shadow-sm flex items-center justify-between px-md h-14">
        <div className="flex items-center">
          <button onClick={() => navigate('/profile')} className="active:scale-95 transition-transform text-primary p-2 -ml-2 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold ml-sm">Language</h1>
        </div>
        <button onClick={handleSave} className="text-primary font-label-md font-bold hover:underline">Save</button>
      </header>

      <main className="pt-20 px-gutter max-w-2xl mx-auto space-y-md">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-border-gray overflow-hidden divide-y divide-border-gray">
          {languages.map(lang => (
            <label key={lang.code} className="flex items-center justify-between p-md cursor-pointer hover:bg-surface-container-low transition-colors">
              <div>
                <p className="font-title-md text-on-surface">{lang.name}</p>
                <p className="font-body-sm text-on-surface-variant">{lang.nativeName}</p>
              </div>
              <div className="relative flex items-center justify-center">
                <input 
                  type="radio" 
                  name="language" 
                  value={lang.code} 
                  checked={selectedLanguage === lang.code}
                  onChange={() => setSelectedLanguage(lang.code)}
                  className="peer appearance-none w-5 h-5 rounded-full border-2 border-outline checked:border-primary transition-colors cursor-pointer"
                />
                <span className="material-symbols-outlined absolute text-[14px] text-primary opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">circle</span>
              </div>
            </label>
          ))}
        </div>
      </main>
    </div>
  );
}
