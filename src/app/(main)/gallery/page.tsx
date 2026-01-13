import Link from 'next/link'
import { templates, Template } from '@/lib/templates'

function TemplateCard({ template }: { template: Template }) {
  const isOur = template.narrativeType === 'our'

  return (
    <div className="group relative">
      {/* Card */}
      <div className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-500 overflow-hidden">
        {/* Template Preview */}
        <div className="aspect-[3/4] relative overflow-hidden bg-gray-50">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
            {/* Minimal Circle Badge */}
            <div className="w-20 h-20 rounded-full mb-8 flex items-center justify-center border border-gray-300">
              <span className="text-xs font-semibold tracking-[0.2em] text-gray-800 uppercase">
                {isOur ? 'Our' : 'Family'}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-3xl font-semibold tracking-wide text-black mb-4">
              {template.name}
            </h3>

            {/* Subtitle */}
            <p className="text-sm font-light text-gray-700 mb-6 tracking-wide">
              {isOur
                ? '우리가 우리가 된 이야기'
                : '두 가족이 하나가 되는 날'}
            </p>

            {/* Divider */}
            <div className="w-12 h-px bg-gray-300" />

            {/* AI Badge */}
            <p className="mt-6 text-[10px] tracking-[0.15em] text-gray-600 uppercase">
              AI Story Generation
            </p>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
            <Link
              href={`/editor?template=${template.id}`}
              className="px-8 py-3 bg-white text-black text-sm tracking-wider hover:bg-gray-100 transition-colors"
            >
              Select Template
            </Link>
          </div>
        </div>

        {/* Template Info */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold tracking-wide text-black">{template.name}</h4>
            <span className="text-[10px] px-3 py-1 border border-gray-400 text-gray-700 tracking-wider uppercase">
              {isOur ? 'Couple' : 'Family'}
            </span>
          </div>
          <p className="text-sm text-gray-700 font-light leading-relaxed mb-5">
            {template.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {template.features.map((feature, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-1 bg-gray-100 text-gray-700 tracking-wide"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-24 px-6 text-center border-b border-gray-100">
        <p className="text-[10px] tracking-[0.3em] text-gray-700 uppercase mb-6">
          AI-Powered Wedding Invitation
        </p>
        <h1 className="text-4xl md:text-5xl font-medium text-black mb-6 tracking-wide">
          Your Story,
          <br />
          <span className="font-semibold">Beautifully Told</span>
        </h1>
        <p className="text-base text-gray-800 max-w-lg mx-auto mb-10 font-light leading-relaxed">
          간단한 질문에 답하면 AI가 두 분만의 이야기를 담은
          <br />
          청첩장을 만들어 드립니다.
        </p>
        <div className="flex items-center justify-center gap-8 text-xs text-gray-700 tracking-wider">
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            Free to Start
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            5 Min Setup
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-700 rounded-full" />
            AI Generated
          </span>
        </div>
      </section>

      {/* Template Gallery */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-[10px] tracking-[0.3em] text-gray-700 uppercase mb-4 font-semibold">
              Choose Your Style
            </p>
            <h2 className="text-2xl font-semibold text-black tracking-wide mb-3">
              Story Templates
            </h2>
            <p className="text-sm text-gray-700 font-light">
              두 분의 이야기를 어떻게 담고 싶으신가요?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gray-950 text-center">
        <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase mb-6">
          Get Started
        </p>
        <h2 className="text-3xl font-light text-white mb-4 tracking-wide">
          Begin Your Story
        </h2>
        <p className="text-sm text-gray-400 mb-10 font-light">
          로그인 후 나만의 청첩장을 만들어보세요
        </p>
        <Link
          href="/"
          className="inline-block px-10 py-4 bg-white text-black text-sm tracking-wider hover:bg-gray-100 transition-colors"
        >
          시작하기
        </Link>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-gray-300 rounded-full">
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-black mb-2 tracking-wide">AI Writing</h3>
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                질문에 답하면 AI가 자연스러운 문구를 생성합니다
              </p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-gray-300 rounded-full">
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-black mb-2 tracking-wide">Mobile First</h3>
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                모바일에 최적화된 아름다운 청첩장
              </p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-gray-300 rounded-full">
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-black mb-2 tracking-wide">Easy Share</h3>
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                카카오톡, 문자로 간편하게 공유
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
