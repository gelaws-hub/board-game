"use client"

import { useState } from "react"
import { faker } from "@faker-js/faker"

const NameInputModal = ({ isOpen, onSubmit, currentName = "" }) => {
  const [name, setName] = useState(currentName || faker.person.firstName())

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  const generateRandomName = () => {
    setName(faker.person.firstName())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-yellow-600 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-3xl sm:text-4xl mb-4">🎰</div>
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-2">Welcome to Poker Game</h2>
          <p className="text-gray-300 text-sm sm:text-base">Enter your name to start playing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm sm:text-base"
                placeholder="Enter your name"
                maxLength={20}
                required
              />
              <button
                type="button"
                onClick={generateRandomName}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                title="Generate new name"
              >
                🎲
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 text-sm sm:text-base"
          >
            Use this name
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">Your name will be saved locally for future sessions</p>
      </div>
    </div>
  )
}

export default NameInputModal
