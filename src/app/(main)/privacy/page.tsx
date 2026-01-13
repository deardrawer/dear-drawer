// TODO: 실제 개인정보처리방침 내용으로 교체 필요
export default function PrivacyPage() {
  return (
    <div className="py-20 px-6">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold text-black mb-8 tracking-wide">
          개인정보처리방침
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 leading-relaxed">
            이 페이지는 준비 중입니다.
          </p>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              개인정보처리방침 내용이 곧 업데이트될 예정입니다.
              <br />
              문의사항은{' '}
              <a
                href="mailto:dear.drawer@gmail.com"
                className="text-gray-700 underline underline-offset-2 hover:text-black"
              >
                dear.drawer@gmail.com
              </a>
              으로 연락해 주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
