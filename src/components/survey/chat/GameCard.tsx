'use client'

import { GameData, GAME_EMOJIS } from '@/lib/marker-parser'
import { ThemeSettings } from '@/lib/types'

interface GameCardProps {
  game: GameData
  isDarkScene: boolean
  theme: ThemeSettings
  onSend: (text: string) => void
}

export function GameCard({ game, isDarkScene, theme, onSend }: GameCardProps) {
  return (
    <div className={`flex-shrink-0 px-4 py-3 border-t ${isDarkScene ? 'bg-black/20 border-white/10' : 'bg-white/80 border-gray-100'}`}>
      <div className="max-w-lg mx-auto animate-gameCardIn">
        <div className={`rounded-xl p-4 ${isDarkScene ? 'bg-white/10' : 'bg-gradient-to-r from-indigo-50 to-purple-50'}`}>
          {game.type === 'truth_or_dare' && (
            <div className="flex gap-3">
              {game.data.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => onSend(opt)}
                  className="flex-1 py-4 rounded-xl text-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                  style={{
                    backgroundColor: i === 0 ? '#ede9fe' : '#fce7f3',
                    color: i === 0 ? '#7c3aed' : '#db2777',
                  }}
                >
                  <div className="text-2xl mb-1">{i === 0 ? '💭' : '🎯'}</div>
                  <div className="text-sm font-medium">{opt}</div>
                </button>
              ))}
            </div>
          )}
          {game.type === 'vote' && (
            <div className="space-y-2">
              {game.data.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => onSend(opt)}
                  className={`w-full py-3 px-4 rounded-xl text-left text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 ${
                    isDarkScene ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white hover:bg-gray-50 shadow-sm'
                  }`}
                >
                  <span className="text-lg">{GAME_EMOJIS[i % GAME_EMOJIS.length]}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          )}
          {game.type === 'guess' && (
            <div className="text-center">
              <p className={`text-sm mb-3 ${isDarkScene ? 'text-gray-300' : 'text-gray-600'}`}>{game.data[0]}</p>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(String(i + 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:scale-110 active:scale-90"
                    style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
          {game.type === 'word_chain' && (
            <div className="text-center">
              <div className="text-2xl mb-2">🔗</div>
              <p className={`text-sm mb-2 font-medium ${isDarkScene ? 'text-white' : 'text-gray-700'}`}>词语接龙</p>
              <p className={`text-xs mb-3 ${isDarkScene ? 'text-gray-400' : 'text-gray-500'}`}>起始词：{game.data[0]}</p>
            </div>
          )}
          {game.type === 'quiz' && (
            <div>
              <div className="text-center mb-3">
                <div className="text-2xl mb-1">📝</div>
                <p className={`text-sm font-medium ${isDarkScene ? 'text-white' : 'text-gray-700'}`}>{game.data[0]}</p>
              </div>
              <div className="space-y-2">
                {game.data.slice(1).map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(opt)}
                    className={`w-full py-2.5 px-4 rounded-xl text-left text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 ${
                      isDarkScene ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white hover:bg-indigo-50 shadow-sm'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}>{String.fromCharCode(65 + i)}</span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {game.type === 'fortune' && (
            <div className="text-center">
              <div className="text-3xl mb-2">🔮</div>
              <p className={`text-sm font-medium mb-1 ${isDarkScene ? 'text-white' : 'text-gray-700'}`}>{game.data[0]}</p>
              <p className={`text-xs ${isDarkScene ? 'text-gray-400' : 'text-gray-500'}`}>{game.data[1]}</p>
              <button
                onClick={() => onSend('继续')}
                className="mt-3 px-5 py-2 rounded-full text-xs text-white transition-all hover:scale-105"
                style={{ backgroundColor: theme.primaryColor }}
              >好的，继续</button>
            </div>
          )}
          {game.type === 'roleplay' && (
            <div className="text-center">
              <div className="text-2xl mb-2">🎬</div>
              <p className={`text-xs mb-1 ${isDarkScene ? 'text-gray-400' : 'text-gray-400'}`}>即兴表演</p>
              <p className={`text-sm font-medium ${isDarkScene ? 'text-white' : 'text-gray-700'}`}>{game.data[0]}</p>
            </div>
          )}
          {game.type === 'confession' && (
            <div className="text-center">
              <div className="text-2xl mb-2">💌</div>
              <p className={`text-xs mb-1 ${isDarkScene ? 'text-gray-400' : 'text-gray-400'}`}>心里话时间</p>
              <p className={`text-sm ${isDarkScene ? 'text-gray-300' : 'text-gray-600'}`}>{game.data[0]}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
