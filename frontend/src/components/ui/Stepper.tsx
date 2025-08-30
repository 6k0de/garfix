import React, { Fragment } from 'react'
interface StepperProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}
const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="sticky w-full py-6">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <Fragment key={index}>
            {/* Step indicator */}
            <div
              className={`flex items-center justify-center ${
                onStepClick ? 'cursor-pointer' : ''
              }`}
              onClick={() =>
                onStepClick && index < currentStep && onStepClick(index)
              }
            >
              <div
                className={`rounded-full transition duration-500 ease-in-out h-12 w-12 flex items-center justify-center py-3 ${
                  index < currentStep
                    ? 'bg-green-600 text-white'
                    : index === currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                ) : (
                  <span className="text-lg font-medium">{index + 1}</span>
                )}
              </div>
              <div className="absolute text-center mt-18 w-32 text-xs font-medium uppercase text-gray-700 dark:text-gray-300">
                {step}
              </div>
            </div>
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-auto border-t-2 transition duration-500 ease-in-out ${
                  index < currentStep ? 'border-green-600' : 'border-gray-300'
                } dark:border-gray-600'}`}
              ></div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
export default Stepper
