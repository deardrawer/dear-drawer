/**
 * THE PHONE 전용 글꼴 — 다른 템플릿에는 필요 없어서 루트 layout 이 아니라 여기서만 불러온다.
 * 이 클래스를 폰 화면 바깥 상자(하객 화면 · 에디터 캔버스)에 붙인다.
 */
import { Bodoni_Moda, Oswald, Courier_Prime } from 'next/font/google'

const bodoni = Bodoni_Moda({ variable: '--font-bodoni', subsets: ['latin'], weight: ['600', '700'], display: 'swap', preload: false })
const oswald = Oswald({ variable: '--font-oswald', subsets: ['latin'], weight: ['300', '400'], display: 'swap', preload: false })
const courier = Courier_Prime({ variable: '--font-courier-prime', subsets: ['latin'], weight: ['400', '700'], display: 'swap', preload: false })

export const PHONE_FONT_VARS = [bodoni.variable, oswald.variable, courier.variable].join(' ')
