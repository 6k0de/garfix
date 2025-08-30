import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientFormStep } from './StepFormService/ClientForm-firtstStep'
import { DeviceStep } from './StepFormService/DeviceStep-secondStep'
import { ServiceDetailStep } from './StepFormService/ServiceDetails-thirdStep'
import { SumaryStep } from './StepFormService/Summary-fourStep'
import { Card } from '@/components/ui/Card'
import { CheckIcon, ClipboardIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Stepper from '@/components/ui/Stepper'
import { useTranslation } from 'react-i18next'
import { createService } from '@/services/service/service.api'

export const CreateService: React.FC = () => {
  const {t} = useTranslation(['common', 'services'])
  const navigate = useNavigate()
  const [currenStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, _] = useState(false)
  const [formData, setFormData] = useState({
    client: null,
    newClient: null,
    devices: [],
    serviceDetails: null,
  })

  const steps = [
    t('services:first-step.stepper.one'),
    t('services:first-step.stepper.two'),
    t('services:first-step.stepper.three'),
    t('services:first-step.stepper.four'),
  ]

  const nextSetp = () => {
    setCurrentStep(currenStep + 1)
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setCurrentStep(currenStep - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async() => {
    setIsSubmitting(true)
    try {
      const res = await createService(formData)
      console.log(res)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currenStep) {
      case 0:
        return (
          <ClientFormStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextSetp}
          />
        )
      case 1:
        return (
          <DeviceStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextSetp}
            prevStep={prevStep}
          />
        )
      case 2:
        return (
          <ServiceDetailStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextSetp}
            prevStep={prevStep}
          />
        )
      case 3:
        return (
          <SumaryStep
            formData={formData}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            prevStep={prevStep}
          />
        )
      default:
        return null
    }
  }
  return (
    <>
      <div className="max-w-8xl pr-20 pl-20">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('services:title')}

          </h1>
          <p className="mt-3 text-md text-gray-500 dark:text-gray-300">
            {t('services:description')}

          </p>
        </div>
        {success ? (
          <Card className="p-8 text-center animate-fadeIn">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
              <CheckIcon
                size={24}
                className="text-green-600 dark:text-green-400"
              />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              {t('services:success')}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
               {t('services:qrCodeMessage')} {'N/A'}
              {/*  {formData?.serviceDetails?.qrCode} */}
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => navigate('/services/list')}
                icon={<ClipboardIcon size={18} />}
              >
                {t('services:finish')}
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="mb-8">
              <Stepper steps={steps} currentStep={currenStep} />
            </div>
            <Card className="p-6">{renderStep()}</Card>
          </>
        )}
      </div>
    </>
  )
}
