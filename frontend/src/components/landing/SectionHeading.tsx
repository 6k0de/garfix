import type React from 'react'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description: string
  align?: 'left' | 'center'
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  align = 'left',
}) => {
  const alignmentClassName =
    align === 'center' ? 'mx-auto items-center text-center' : 'items-start'

  return (
    <div className={`flex max-w-2xl flex-col ${alignmentClassName}`}>
      <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
        {eyebrow}
      </span>
      <h2
        className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
        style={{ fontFamily: '"Fraunces", serif' }}
      >
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  )
}
