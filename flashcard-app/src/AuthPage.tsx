import React, { useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  nickname: string;
  createdAt: Date;
  lastLogin: Date;
  lastActivity: Date;
  totalAnswered: number;
  correctAnswers: number;
  cardsLearned: number;
  cardsMastered: number;
  streakDays: number;
  level: number;
  totalCards: number;
  cardsToReview: number;
  studyStreak: number;
  totalStudyTime: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

interface AuthPageProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogin: (user: User) => void;
  users: User[];
  onRegister: (user: User) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const AuthPage: React.FC<AuthPageProps> = ({
  theme,
  onToggleTheme,
  onLogin,
  users,
  onRegister,
  onShowToast
}) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerNickname, setRegisterNickname] = useState('');



  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginUsername && u.password === loginPassword);
    if (user) {
      user.lastLogin = new Date();
      onLogin(user);
      onShowToast(`Vítejte zpět, ${user.nickname}! 👋`, 'success');
    } else {
      onShowToast('Nesprávné přihlašovací údaje! 🔒', 'error');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== registerConfirmPassword) {
      onShowToast('Hesla se neshodují! 🔑', 'error');
      return;
    }

    if (users.find(u => u.username === registerUsername)) {
      onShowToast('Uživatelské jméno již existuje! 👤', 'error');
      return;
    }

    if (users.find(u => u.email === registerEmail)) {
      onShowToast('Email již existuje! 📧', 'error');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      username: registerUsername,
      email: registerEmail,
      password: registerPassword,
      nickname: registerNickname || registerUsername,
      createdAt: new Date(),
      lastLogin: new Date(),
      lastActivity: new Date(),
      totalAnswered: 0,
      correctAnswers: 0,
      cardsLearned: 0,
      cardsMastered: 0,
      streakDays: 0,
      level: 0,
      totalCards: 0,
      cardsToReview: 0,
      studyStreak: 0,
      totalStudyTime: 0,
      weeklyGoal: 20,
      weeklyProgress: 0
    };

    onRegister(newUser);
    onShowToast(`Vítejte, ${newUser.nickname}! 🎉`, 'success');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          {!showLogin && !showRegister ? (
            /* Landing Page */
            <div className="text-center">
              {/* Theme Toggle - Top Right */}
              <div className="absolute top-6 right-6">
                <button
                  onClick={onToggleTheme}
                  className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 group backdrop-blur-sm shadow-lg"
                >
                  <div className="w-6 h-6 relative">
                    {theme === 'light' ? (
                      <svg className="w-6 h-6 text-amber-500 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-blue-400 transition-transform group-hover:-rotate-12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>

              {/* Main Landing Content */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-black/10 p-12 max-w-4xl mx-auto">
                {/* Logo and Title */}
                <div className="mb-12">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/25">
                    <span className="text-white text-6xl">🧠</span>
                  </div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
                    FlashCard Manager
                  </h1>
                  <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Moderní způsob učení s kartičkami. Vytvářejte, organizujte a procvičujte své znalosti efektivně s pokročilými funkcemi.
                  </p>
                </div>
                
                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                  <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/30">
                    <div className="text-5xl mb-4">📚</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Organizace</h3>
                    <p className="text-slate-600 dark:text-slate-400">Kategorizujte kartičky podle předmětů a témat pro lepší přehled</p>
                  </div>
                  <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-100 dark:border-green-800/30">
                    <div className="text-5xl mb-4">🎯</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Procvičování</h3>
                    <p className="text-slate-600 dark:text-slate-400">Inteligentní systém opakování s pokročilým skórováním</p>
                  </div>
                  <div className="p-8 bg-purple-50 dark:bg-purple-900/20 rounded-3xl border border-purple-100 dark:border-purple-800/30">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Statistiky</h3>
                    <p className="text-slate-600 dark:text-slate-400">Sledujte svůj pokrok a výkonnost v detailních grafech</p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => setShowRegister(true)}
                    className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105"
                  >
                    🚀 Začít zdarma
                  </button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="px-10 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105"
                  >
                    📝 Už mám účet
                  </button>
                </div>
              </div>
            </div>
          ) : showLogin ? (
            /* Login Form */
            <div className="max-w-md mx-auto">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-black/10 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🔐</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Přihlášení</h2>
                  <p className="text-slate-600 dark:text-slate-400">Vítejte zpět!</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Uživatelské jméno
                    </label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                      placeholder="Zadejte uživatelské jméno..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Heslo
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                      placeholder="Zadejte heslo..."
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                  >
                    Přihlásit se
                  </button>
                </form>

                {/* Demo Accounts Info */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">🎮 Demo účty pro testování:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { username: 'demo_zacatecnik', level: 0, desc: 'Začátečník' },
                      { username: 'demo_pokrocily', level: 5, desc: 'Pokročilý' },
                      { username: 'demo_expert', level: 8, desc: 'Expert' }
                    ].map(demo => (
                      <button
                        key={demo.username}
                        onClick={() => {
                          setLoginUsername(demo.username);
                          setLoginPassword('demo123');
                        }}
                        className="text-left p-2 rounded-lg bg-blue-100 dark:bg-blue-800/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors duration-200"
                      >
                        <div className="text-xs text-blue-700 dark:text-blue-400">
                          <strong>{demo.username}</strong> - {demo.desc} (Level {demo.level})
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                    Klikněte na účet pro automatické vyplnění
                  </p>
                </div>

                <div className="mt-6 text-center space-y-3">
                  <button
                    onClick={() => {
                      setShowLogin(false);
                      setShowRegister(true);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Nemáte účet? Registrujte se
                  </button>
                  <div>
                    <button
                      onClick={() => {
                        setShowLogin(false);
                        setLoginUsername('');
                        setLoginPassword('');
                      }}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      ← Zpět na hlavní stránku
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Register Form */
            <div className="max-w-md mx-auto">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-black/10 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🚀</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Registrace</h2>
                  <p className="text-slate-600 dark:text-slate-400">Vytvořte si účet zdarma!</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Uživatelské jméno
                    </label>
                    <input
                      type="text"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                      placeholder="Zadejte uživatelské jméno..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Přezdívka (zobrazované jméno)
                    </label>
                    <input
                      type="text"
                      value={registerNickname}
                      onChange={(e) => setRegisterNickname(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                      placeholder="Jak se máme oslovovat? (volitelné)"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <div className="mb-2">
                      <div className="w-16 h-16 mx-auto rounded-full border-2 border-blue-400 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                        <img
                          src="/avatars/1.png"
                          alt="Starting avatar"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Váš avatar</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Začínáte jako začátečník! Avatar se bude vyvíjet podle vašeho pokroku v učení.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                      placeholder="Zadejte email..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Heslo
                    </label>
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                      placeholder="Zadejte heslo..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Potvrzení hesla
                    </label>
                    <input
                      type="password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-400 backdrop-blur-sm"
                      placeholder="Potvrďte heslo..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-2xl font-semibold shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                  >
                    Vytvořit účet
                  </button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <button
                    onClick={() => {
                      setShowRegister(false);
                      setShowLogin(true);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Už máte účet? Přihlaste se
                  </button>
                  <div>
                    <button
                      onClick={() => {
                        setShowRegister(false);
                        setRegisterUsername('');
                        setRegisterEmail('');
                        setRegisterPassword('');
                        setRegisterConfirmPassword('');
                        setRegisterNickname('');
                      }}
                      className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      ← Zpět na hlavní stránku
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
