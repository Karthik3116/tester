// frontend/src/components/QuizQuestion.jsx
import React from 'react';

function QuizQuestion({ question, questionIndex, selectedOption, onOptionSelect }) {
  if (!question) {
    return <div className="text-center text-gray-600">Loading question...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">
        {questionIndex + 1}. {question.question}
      </h3>
      <div className="space-y-4">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors duration-200
              ${selectedOption === option ? 'bg-blue-100 border-blue-500 border-2 shadow-inner' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}
          >
            <input
              type="radio"
              name={`question-${questionIndex}`}
              value={option}
              checked={selectedOption === option}
              onChange={() => onOptionSelect(questionIndex, option)}
              className="form-radio h-5 w-5 text-blue-600 transition duration-150 ease-in-out mr-4"
            />
            <span className="text-lg text-gray-800">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default QuizQuestion;
