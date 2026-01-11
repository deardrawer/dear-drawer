(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,80052,e=>{"use strict";var t=e.i(43476),a=e.i(71645),s=e.i(18566),i=e.i(66412),n=e.i(10031);function r({audioRef:e,isVisible:s,shouldAutoPlay:i}){let[n,r]=(0,a.useState)(!1),o=(0,a.useRef)(!1);return((0,a.useEffect)(()=>{i&&!o.current&&e.current&&(o.current=!0,"false"!==localStorage.getItem("musicEnabled")&&setTimeout(()=>{e.current?.play().then(()=>r(!0)).catch(e=>console.log("Auto-play failed:",e))},100))},[i,e]),(0,a.useEffect)(()=>{let t=e.current;if(!t)return;let a=()=>r(!0),s=()=>r(!1);return t.addEventListener("play",a),t.addEventListener("pause",s),()=>{t.removeEventListener("play",a),t.removeEventListener("pause",s)}},[e]),s)?(0,t.jsx)("button",{onClick:()=>{e.current&&(e.current.paused?e.current.play().then(()=>{r(!0),localStorage.setItem("musicEnabled","true")}).catch(console.error):(e.current.pause(),r(!1),localStorage.setItem("musicEnabled","false")))},className:"fixed top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-50 transition-all hover:scale-110 active:scale-95",style:{background:"rgba(255,255,255,0.9)",boxShadow:"0 2px 8px rgba(0,0,0,0.1)"},"aria-label":n?"음악 끄기":"음악 켜기",children:n?(0,t.jsx)("svg",{className:"w-5 h-5 text-gray-700",viewBox:"0 0 24 24",fill:"currentColor",children:(0,t.jsx)("path",{d:"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"})}):(0,t.jsx)("svg",{className:"w-5 h-5 text-gray-400",viewBox:"0 0 24 24",fill:"currentColor",children:(0,t.jsx)("path",{d:"M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"})})}):null}let o=`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scrollDown {
    0%, 100% { transform: translateY(0); opacity: 1; }
    50% { transform: translateY(6px); opacity: 0.5; }
  }

  @keyframes scrollDotMove {
    0%, 100% {
      opacity: 0;
      transform: translateY(-28px);
    }
    20% {
      opacity: 1;
    }
    50% {
      opacity: 1;
      transform: translateY(0);
    }
    70% {
      opacity: 1;
      transform: translateY(-14px);
    }
    90% {
      opacity: 0;
      transform: translateY(0);
    }
  }

  /* Divider Line Expand Animation */
  @keyframes expandFromRight {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }

  @keyframes expandFromLeft {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }

  .divider-bar-left {
    transform-origin: right center;
    animation: expandFromRight 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .divider-bar-right {
    transform-origin: left center;
    animation: expandFromLeft 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.1s;
    transform: scaleX(0);
  }

  /* Cinematic Intro Animations */
  .cinematic-bg {
    opacity: 0;
    transform: scale(1.1);
    transition: opacity 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .cinematic-bg.active {
    opacity: 1;
    transform: scale(1);
  }

  .cinematic-content {
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .cinematic-content.show {
    opacity: 1;
    transform: translateY(0);
  }

  .cinematic-line {
    width: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.5);
    transition: width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .cinematic-content.show .cinematic-line {
    width: 50px;
  }

  .cinematic-text {
    opacity: 0;
    letter-spacing: 6px;
    transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s,
                letter-spacing 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s;
  }
  .cinematic-content.show .cinematic-text {
    opacity: 1;
    letter-spacing: 3px;
  }

  .cinematic-subtext {
    opacity: 0;
    transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s;
  }
  .cinematic-content.show .cinematic-subtext {
    opacity: 1;
  }

  /* Divider Section - matching original template */
  .divider-section {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 180px 28px;
  }

  .divider-section.chapter-break {
    min-height: 50vh;
    padding: 100px 28px;
  }

  .divider-line {
    width: 1px;
    height: 40px;
    margin: 24px 0;
    transform: scaleY(0);
    transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .divider-line.top {
    transform-origin: bottom center;
  }

  .divider-line.bottom {
    transform-origin: top center;
    transition-delay: 0.6s;
  }

  .divider-section.in-view .divider-line {
    transform: scaleY(1);
  }

  /* Divider Text Animation - Center Expand */
  .divider-text-mask {
    position: relative;
    display: block;
    text-align: center;
    padding: 10px 0;
  }

  .divider-text-mask .text-line {
    display: block;
    opacity: 0;
    letter-spacing: -2px;
    transform: scaleX(0.8);
    transition: opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                letter-spacing 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .divider-text-mask .text-line:nth-child(2) {
    transition-delay: 0.2s;
  }

  .divider-section.in-view .divider-text-mask .text-line {
    opacity: 1;
    letter-spacing: 3px;
    transform: scaleX(1);
  }

  .divider-section.in-view .divider-text-mask .text-line:nth-child(2) {
    transition-delay: 0.25s;
  }

  /* Story Section Animations */
  .story-section {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 1.2s ease, transform 1.2s ease;
  }

  .story-section.in-view {
    opacity: 1;
    transform: translateY(0);
  }

  .story-date {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s;
  }

  .story-section.in-view .story-date {
    opacity: 1;
    transform: translateY(0);
  }

  .story-title {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1.2s ease 0.6s, transform 1.2s ease 0.6s;
  }

  .story-section.in-view .story-title {
    opacity: 1;
    transform: translateY(0);
  }

  .story-desc {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1.2s ease 0.9s, transform 1.2s ease 0.9s;
  }

  .story-section.in-view .story-desc {
    opacity: 1;
    transform: translateY(0);
  }

  .story-photos {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1.2s ease 1.2s, transform 1.2s ease 1.2s;
  }

  .story-section.in-view .story-photos {
    opacity: 1;
    transform: translateY(0);
  }

  /* Invitation Section Animations - matching original template */
  .invitation-section {
    opacity: 0;
  }

  .invitation-section.in-view {
    opacity: 1;
  }

  .invitation-title {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .invitation-title {
    animation: fadeInUp 0.8s ease forwards;
  }

  .quote-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .quote-section {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 0.3s;
  }

  .greeting-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .greeting-section {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 0.6s;
  }

  .parents-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .parents-section {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 0.8s;
  }

  .wedding-info-card {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .wedding-info-card {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 1s;
  }

  .next-story-section {
    opacity: 0;
    transform: translateY(20px);
  }

  .invitation-section.in-view .next-story-section {
    animation: fadeInUp 0.8s ease forwards;
    animation-delay: 1.2s;
  }

  /* Wave Animation */
  @keyframes waveBack {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-3%); }
  }

  @keyframes waveMid {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(2%); }
  }

  @keyframes waveFront {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-2%); }
  }

  /* Profile Label Underline Animation */
  .profile-label-animated {
    position: relative;
    display: inline-block;
  }

  .profile-label-animated::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    width: 0;
    height: 1px;
    background: currentColor;
    opacity: 0.4;
    transition: width 1s ease-out, left 1s ease-out;
  }

  .profile-label-animated.revealed::after {
    width: 100%;
    left: 0;
  }
`;function l(){let e=(0,a.useRef)(null),[t,s]=(0,a.useState)(!1),[i,n]=(0,a.useState)(!1);return(0,a.useEffect)(()=>{let e=setTimeout(()=>n(!0),50);return()=>clearTimeout(e)},[]),(0,a.useEffect)(()=>{if(!i)return;let t=new IntersectionObserver(([e])=>{e.isIntersecting&&(s(!0),t.unobserve(e.target))},{threshold:.1,rootMargin:"0px 0px -50px 0px"});return e.current&&t.observe(e.current),()=>t.disconnect()},[i]),{ref:e,isVisible:t}}function c({children:e,className:a,style:s,delay:i=0}){let{ref:n,isVisible:r}=l();return(0,t.jsx)("div",{ref:n,className:a,style:{...s,opacity:+!!r,transform:r?"translateY(0)":"translateY(30px)",transition:`opacity 0.8s ease ${i}s, transform 0.8s ease ${i}s`},children:e})}function d({lines:e,dividerColor:a,fontFamily:s,textColor:i,bgColor:n,isChapterBreak:r=!1}){let{ref:o,isVisible:c}=l();return(0,t.jsxs)("div",{ref:o,className:`divider-section ${r?"chapter-break":""} ${c?"in-view":""}`,style:{background:n},children:[(0,t.jsx)("div",{className:"divider-line top",style:{background:a}}),(0,t.jsx)("div",{className:"divider-text-mask",children:e.map((e,a)=>(0,t.jsx)("span",{className:"text-line",style:{fontFamily:s,fontSize:"14px",color:i,lineHeight:1.9},children:e},a))}),(0,t.jsx)("div",{className:"divider-line bottom",style:{background:a}})]})}function m({profile:e,fonts:s,themeColors:i,bgColor:r}){let{ref:o,isVisible:c}=l(),[d,m]=(0,a.useState)(!1);return(0,a.useEffect)(()=>{if(c){let e=setTimeout(()=>m(!0),300);return()=>clearTimeout(e)}},[c]),(0,t.jsxs)("div",{ref:o,className:"px-7 py-14",style:{background:r},children:[(0,t.jsx)("div",{style:{opacity:+!!c,transform:c?"translateY(0)":"translateY(30px)",transition:"opacity 1.2s ease, transform 1.2s ease"},children:(0,t.jsx)(n.default,{images:e.images,imageSettings:e.imageSettings,className:"mb-10"})}),(0,t.jsxs)("div",{className:"text-center mb-8",children:[(0,t.jsx)("p",{className:`profile-label-animated text-[10px] font-light mb-1.5 ${d?"revealed":""}`,style:{fontFamily:s.display,color:i.gray,letterSpacing:"3px",opacity:+!!c,transform:c?"translateY(0)":"translateY(20px)",transition:"opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s"},children:e.aboutLabel}),(0,t.jsx)("p",{className:"text-[11px] font-light",style:{color:"#999",opacity:+!!c,transform:c?"translateY(0)":"translateY(20px)",transition:"opacity 1.2s ease 0.6s, transform 1.2s ease 0.6s"},children:e.subtitle})]}),(0,t.jsx)("div",{className:"text-xs font-light leading-[2.2] text-left",style:{fontFamily:s.displayKr,color:i.text,opacity:+!!c,transform:c?"translateY(0)":"translateY(20px)",transition:"opacity 1.2s ease 0.9s, transform 1.2s ease 0.9s"},dangerouslySetInnerHTML:{__html:e.intro.replace(/\n/g,"<br/>")}}),e.tag&&(0,t.jsxs)("div",{className:"inline-flex items-center gap-1.5 mt-5 px-3.5 py-2 rounded-md text-[10px] font-light",style:{background:"rgba(0,0,0,0.03)",color:"#777",opacity:+!!c,transform:c?"translateY(0)":"translateY(20px)",transition:"opacity 1.2s ease 1.2s, transform 1.2s ease 1.2s"},children:["♥ ",e.tag]})]})}function p({title:e,content:s,buttonText:i,buttonUrl:n,fonts:r,themeColors:o}){let{ref:c,isVisible:d}=l(),[m,p]=(0,a.useState)(!1);return(0,a.useEffect)(()=>{if(d){let e=setTimeout(()=>p(!0),300);return()=>clearTimeout(e)}},[d]),(0,t.jsxs)("div",{ref:c,className:"rounded-[20px] px-6 py-6 mb-4",style:{background:"#ffffff",boxShadow:"0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.04)",opacity:+!!d,transform:d?"translateY(0)":"translateY(20px)",transition:"opacity 0.6s ease, transform 0.6s ease"},children:[(0,t.jsxs)("h4",{className:`profile-label-animated text-[13px] mb-4 flex items-center gap-2 ${m?"revealed":""}`,style:{fontFamily:r.displayKr,color:o.text,fontWeight:500},children:[(0,t.jsx)("span",{className:"w-[3px] h-[14px] rounded-sm flex-shrink-0",style:{background:o.accent}}),e]}),(0,t.jsx)("p",{className:"text-xs font-light leading-[2]",style:{color:"#666"},dangerouslySetInnerHTML:{__html:s.replace(/\n/g,"<br/>")}}),i&&n&&(0,t.jsx)("button",{onClick:()=>window.open(n,"_blank"),className:"mt-4 px-5 py-2.5 rounded-full text-[11px] font-light transition-all hover:opacity-80",style:{background:o.primary,color:"#fff"},children:i})]})}function x({interview:e,fonts:s,themeColors:i,bgColor:n}){let{ref:r,isVisible:o}=l(),[c,d]=(0,a.useState)(!1);return(0,a.useEffect)(()=>{if(o){let e=setTimeout(()=>d(!0),300);return()=>clearTimeout(e)}},[o]),(0,t.jsxs)("div",{ref:r,className:"px-7 py-14",style:{background:n},children:[(0,t.jsx)("div",{style:{opacity:+!!o,transform:o?"translateY(0)":"translateY(30px)",transition:"opacity 1.2s ease, transform 1.2s ease"},children:e.images&&e.images.length>0?1===e.images.length?(0,t.jsx)("div",{className:"w-full aspect-[4/5] rounded-xl mb-8 overflow-hidden",children:(0,t.jsx)("div",{className:"w-full h-full bg-cover bg-center bg-gray-100",style:{backgroundImage:e.images[0]?`url(${e.images[0]})`:void 0}})}):(0,t.jsx)("div",{className:"grid grid-cols-2 gap-2 mb-8",children:e.images.slice(0,2).map((e,a)=>(0,t.jsx)("div",{className:"aspect-square rounded-xl overflow-hidden",children:(0,t.jsx)("div",{className:"w-full h-full bg-cover bg-center bg-gray-100",style:{backgroundImage:e?`url(${e})`:void 0}})},a))}):(0,t.jsx)("div",{className:"w-full aspect-[4/5] rounded-xl mb-8 bg-gray-100 flex items-center justify-center",children:(0,t.jsx)("span",{className:"text-gray-400 text-sm",children:"Interview Image"})})}),e.question&&(0,t.jsx)("div",{className:"text-center mb-5",style:{opacity:+!!o,transform:o?"translateY(0)":"translateY(20px)",transition:"opacity 1.2s ease 0.3s, transform 1.2s ease 0.3s"},children:(0,t.jsx)("p",{className:`profile-label-animated text-sm inline-block ${c?"revealed":""}`,style:{fontFamily:s.displayKr,color:i.text,fontWeight:400},children:e.question})}),e.answer&&(0,t.jsx)("p",{className:"text-[11px] font-light leading-[2.2]",style:{fontFamily:s.displayKr,color:i.text,opacity:+!!o,transform:o?"translateY(0)":"translateY(20px)",transition:"opacity 1.2s ease 0.6s, transform 1.2s ease 0.6s"},dangerouslySetInnerHTML:{__html:e.answer.replace(/\n/g,"<br/>")}})]})}function g({story:e,fonts:a,themeColors:s}){let{ref:i,isVisible:n}=l();return(0,t.jsxs)("div",{ref:i,className:`story-section ${n?"in-view":""}`,style:{padding:"60px 28px",background:s.sectionBg,textAlign:"center"},children:[e.date&&(0,t.jsx)("p",{className:"story-date",style:{fontFamily:a.display,fontSize:"10px",fontWeight:300,letterSpacing:"2px",color:s.gray,marginBottom:"12px"},children:e.date}),e.title&&(0,t.jsx)("p",{className:"story-title",style:{fontFamily:a.displayKr,fontSize:"15px",fontWeight:400,color:s.text,marginBottom:"12px"},children:e.title}),e.desc&&(0,t.jsx)("p",{className:"story-desc",style:{fontSize:"11px",fontWeight:300,color:"#777",lineHeight:1.9,marginBottom:"28px"},dangerouslySetInnerHTML:{__html:e.desc.replace(/\n/g,"<br/>")}}),e.images&&e.images.length>0&&(0,t.jsx)("div",{className:"story-photos",style:{display:"grid",gridTemplateColumns:1===e.images.length?"1fr":"1fr 1fr",gap:"12px"},children:e.images.slice(0,3).map((a,s)=>(0,t.jsx)("div",{className:3===e.images.length&&0===s?"col-span-2":"",style:{aspectRatio:3===e.images.length&&0===s?"2/1":"1",backgroundImage:a?`url(${a})`:void 0,backgroundSize:"cover",backgroundPosition:"center",backgroundColor:"#f5f5f5",borderRadius:"8px"}},s))})]})}let y={"classic-rose":{primary:"#E91E63",secondary:"#D4A574",accent:"#d4a574",background:"#FFF8F5",sectionBg:"#FFE8E8",cardBg:"#FFFFFF",divider:"#d4b896",text:"#333333",gray:"#666666"},"modern-black":{primary:"#1A1A1A",secondary:"#888888",accent:"#1A1A1A",background:"#FFFFFF",sectionBg:"#F5F5F5",cardBg:"#FFFFFF",divider:"#CCCCCC",text:"#1A1A1A",gray:"#666666"},"romantic-blush":{primary:"#D4A5A5",secondary:"#C9B8A8",accent:"#C9B8A8",background:"#FDF8F6",sectionBg:"#F8EFEC",cardBg:"#FFFFFF",divider:"#D4C4BC",text:"#5C4B4B",gray:"#8B7676"},"nature-green":{primary:"#6B8E6B",secondary:"#A8B5A0",accent:"#8FA888",background:"#F5F7F4",sectionBg:"#EBF0E8",cardBg:"#FFFFFF",divider:"#A8B5A0",text:"#3D4A3D",gray:"#6B7B6B"},"luxury-navy":{primary:"#1E3A5F",secondary:"#C9A96E",accent:"#C9A96E",background:"#F8F9FA",sectionBg:"#E8ECF0",cardBg:"#FFFFFF",divider:"#C9A96E",text:"#1E3A5F",gray:"#5A6B7C"},"sunset-coral":{primary:"#E8846B",secondary:"#F5C7A9",accent:"#E8A87C",background:"#FFFAF7",sectionBg:"#FFEEE5",cardBg:"#FFFFFF",divider:"#E8A87C",text:"#5C4035",gray:"#8B6B5C"}},u={classic:{display:"'Playfair Display', serif",displayKr:"'Nanum Myeongjo', serif",body:"'Nanum Myeongjo', serif"},modern:{display:"'Montserrat', sans-serif",displayKr:"'Noto Sans KR', sans-serif",body:"'Noto Sans KR', sans-serif"},romantic:{display:"'Lora', serif",displayKr:"'Gowun Batang', serif",body:"'Gowun Batang', serif"},contemporary:{display:"'Cinzel', serif",displayKr:"'Gowun Dodum', sans-serif",body:"'Gowun Dodum', sans-serif"},luxury:{display:"'EB Garamond', serif",displayKr:"'Nanum Myeongjo', serif",body:"'Nanum Myeongjo', serif"}},f={id:"demo-invitation-id",colorTheme:"classic-rose",fontStyle:"romantic",groom:{name:"김민준",nameEn:"Minjun Kim",phone:"010-1234-5678",father:{name:"김철수",phone:"010-1111-2222",deceased:!1},mother:{name:"이영희",phone:"010-3333-4444",deceased:!1},bank:{bank:"신한은행",account:"110-123-456789",holder:"김민준",enabled:!0},profile:{images:["/demo/groom1.jpg","/demo/groom2.jpg"],imageSettings:[{scale:1,positionX:0,positionY:0},{scale:1,positionX:0,positionY:0}],aboutLabel:"ABOUT GROOM",subtitle:"신부가 소개하는 신랑",intro:"처음 만났을 때부터 따뜻한 미소가 인상적이었던 사람.\n항상 제 이야기에 귀 기울여주고, 힘들 때 묵묵히 곁에 있어주는 든든한 사람입니다.\n\n요리를 좋아하고, 주말마다 새로운 레시피에 도전하는 모습이 참 사랑스러워요.",tag:"세상에서 가장 따뜻한 사람"}},bride:{name:"이서연",nameEn:"Seoyeon Lee",phone:"010-5678-1234",father:{name:"이정호",phone:"010-5555-6666",deceased:!1},mother:{name:"박미경",phone:"010-7777-8888",deceased:!1},bank:{bank:"국민은행",account:"123-45-678901",holder:"이서연",enabled:!0},profile:{images:["/demo/bride1.jpg","/demo/bride2.jpg"],imageSettings:[{scale:1,positionX:0,positionY:0},{scale:1,positionX:0,positionY:0}],aboutLabel:"ABOUT BRIDE",subtitle:"신랑이 소개하는 신부",intro:"밝은 웃음소리가 참 예쁜 사람.\n제가 지칠 때마다 힘이 되어주고, 작은 것에도 감사할 줄 아는 따뜻한 마음의 소유자입니다.\n\n그림 그리기를 좋아하고, 가끔 저를 위해 그려주는 그림들이 우리 집의 보물이에요.",tag:"매일 웃게 해주는 사람"}},wedding:{date:"2025-05-24",time:"14:00",timeDisplay:"오후 2시",dayOfWeek:"토요일",title:"OUR WEDDING",venue:{name:"더채플앳청담",hall:"루체홀 5층",address:"서울특별시 강남구 청담동 123-45",mapUrl:"",naverMapUrl:"",kakaoMapUrl:""},directions:{car:{desc:'네비게이션에 "더채플앳청담" 검색',route:"강남역 방면에서 청담사거리 방향으로 직진 후 우회전"},subway:["압구정로데오역 5번 출구 도보 10분","청담역 9번 출구 도보 15분"],bus:{main:["146","301","401"],branch:["3422","4412"]},parking:{location:"건물 지하 1~3층 주차장 이용 가능",fee:"3시간 무료 주차권 제공"}}},relationship:{startDate:"2020-03-15",stories:[{date:"2020.03",title:"운명처럼 다가온 만남",desc:"친구의 소개로 처음 만났던 그 날,\n어색한 인사를 나누며 시작된 우리의 이야기.\n카페에서 나눈 세 시간의 대화가\n우리 사랑의 첫 페이지가 되었습니다.",images:["/demo/story1.jpg"]},{date:"2022.12",title:"함께한 첫 해외여행",desc:"제주도부터 시작해 일본, 유럽까지.\n함께 떠난 여행에서 서로를 더 깊이 알게 되었고,\n어떤 상황에서도 함께라면 즐거울 수 있다는 걸 깨달았습니다.",images:["/demo/story2.jpg","/demo/story3.jpg"]},{date:"2024.09",title:"프러포즈",desc:"우리가 처음 만났던 그 카페에서,\n떨리는 마음으로 건넨 반지와 함께\n평생을 약속했습니다.",images:["/demo/story4.jpg"]}],closingText:"그리고 이제 드디어 부르는 서로의 이름에 '신랑', '신부'라는 호칭을 담습니다."},content:{greeting:"서로 다른 길을 걸어온 두 사람이\n이제 같은 길을 함께 걸어가려 합니다.\n\n저희의 새로운 시작을\n축복해 주시면 감사하겠습니다.\n\n귀한 걸음 하시어\n자리를 빛내주세요.",quote:{text:"사랑한다는 것은\n같은 방향을 바라보는 것이다.",author:"생텍쥐페리"},thankYou:{title:"THANK YOU",message:"바쁘신 와중에도 저희의 결혼을\n축하해 주셔서 진심으로 감사드립니다.\n\n여러분의 축복을 마음에 새기며\n서로 아끼고 사랑하며 살겠습니다.",sign:"민준 & 서연 올림"},interviews:[{question:"첫 만남의 기억이 어떠셨나요?",answer:"처음 본 순간, 이 사람이다 싶었어요. 말로 설명하기 어려운 느낌이었는데, 대화를 나눌수록 확신이 들었습니다. 서로의 눈을 바라보며 웃던 그 순간을 잊을 수 없어요.",images:["/demo/interview1.jpg"],bgClass:"pink-bg"},{question:"결혼을 결심하게 된 계기는?",answer:"함께 있을 때 가장 나다울 수 있었어요. 아무리 힘든 일이 있어도 이 사람 곁에 있으면 괜찮아지더라구요. 평생 이 사람과 함께라면 어떤 일이든 해낼 수 있을 것 같았습니다.",images:["/demo/interview2.jpg"],bgClass:"white-bg"}],guestbookQuestions:["두 사람에게 해주고 싶은 말은?","결혼생활에서 가장 중요한 건?","두 사람의 첫인상은 어땠나요?"],info:{dressCode:{title:"Dress Code",content:"단정한 복장으로 와주세요.\n흰색 계열 의상은 피해주시면 감사하겠습니다.",enabled:!0},photoShare:{title:"Photo Sharing",content:"결혼식 사진을 공유해주세요!",buttonText:"사진 공유하기",url:"",enabled:!1},photoBooth:{title:"Photo Booth",content:"로비에서 포토부스를 즐겨보세요!",enabled:!1},flowerChild:{title:"화동 안내",content:"",enabled:!1},customItems:[]}},gallery:{images:["/demo/gallery1.jpg","/demo/gallery2.jpg","/demo/gallery3.jpg","/demo/gallery4.jpg","/demo/gallery5.jpg","/demo/gallery6.jpg"]},media:{coverImage:"/demo/cover.jpg",infoImage:"/demo/info.jpg",bgm:"/audio/wedding-bgm.mp3"},rsvpEnabled:!0,rsvpDeadline:"2025-05-17",rsvpAllowGuestCount:!0,sectionVisibility:{coupleProfile:!0,ourStory:!0,interview:!0,guidance:!0,bankAccounts:!0,guestbook:!0},design:{introAnimation:"fade-in",coverTitle:"OUR WEDDING",sectionDividers:{invitation:"INVITATION",ourStory:"OUR STORY",aboutUs:"ABOUT US",interview:"INTERVIEW",gallery:"GALLERY",information:"INFORMATION",location:"LOCATION",rsvp:"RSVP",thankYou:"THANK YOU",guestbook:"GUESTBOOK"}},bgm:{enabled:!0,url:"/audio/wedding-bgm.mp3",autoplay:!0},guidance:{enabled:!1,title:"행복한 시간을 위한 안내",content:"",image:"",imageSettings:{scale:1,positionX:0,positionY:0}}};function h(e){if(!e)return"";let t=new Date(e),a=t.getFullYear(),s=t.getMonth()+1,i=t.getDate(),n=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][t.getDay()];return`${a}.${s}.${i} ${n}`}function b({invitation:e,fonts:s,themeColors:i,onNavigate:n,onScreenChange:r}){let[o,l]=(0,a.useState)(!1),[c,d]=(0,a.useState)("car"),[m,p]=(0,a.useState)(!1),[x,g]=(0,a.useState)(!1),[y,u]=(0,a.useState)(!1),[f,b]=(0,a.useState)(!1),[v,j]=(0,a.useState)(!1),[N,w]=(0,a.useState)("cover"),[k,F]=(0,a.useState)(!1),[S,T]=(0,a.useState)(!1),[C,B]=(0,a.useState)(!1),Y=(0,a.useRef)(0);(0,a.useEffect)(()=>{let e=setTimeout(()=>p(!0),100),t=setTimeout(()=>g(!0),1e3),a=setTimeout(()=>b(!0),3200),s=setTimeout(()=>j(!0),3500),i=setTimeout(()=>u(!0),4200);return()=>{clearTimeout(e),clearTimeout(t),clearTimeout(a),clearTimeout(s),clearTimeout(i)}},[]);let A=(e,t)=>{k||(F(!0),setTimeout(()=>{w(t),F(!1),"invitation"===t&&(setTimeout(()=>T(!0),50),setTimeout(()=>B(!0),1500)),r?.(t)},500))},I=e.wedding.directions,M=[{key:"car",label:"자가용"},...I.subway&&I.subway.length>0?[{key:"subway",label:"지하철"}]:[],...I.bus&&(I.bus.main?.length>0||I.bus.branch?.length>0)?[{key:"bus",label:"버스"}]:[],...I.parking&&(I.parking.location||I.parking.fee)?[{key:"parking",label:"주차"}]:[]];return(0,t.jsxs)("div",{children:[!y&&(0,t.jsxs)("div",{className:"fixed inset-0 z-50 flex flex-col justify-center items-center",style:{background:"#000",opacity:+!f,transition:"opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",pointerEvents:"none"},children:[(0,t.jsx)("div",{className:`cinematic-bg absolute inset-0 ${m?"active":""}`,style:{backgroundImage:e.media.coverImage?`url(${e.media.coverImage})`:"linear-gradient(135deg, #333 0%, #111 100%)",backgroundSize:"cover",backgroundPosition:"center",filter:"grayscale(100%)"}}),(0,t.jsx)("div",{className:"absolute inset-0",style:{background:"rgba(0, 0, 0, 0.45)"}}),(0,t.jsxs)("div",{className:`cinematic-content relative z-10 text-center ${x?"show":""}`,children:[(0,t.jsx)("div",{className:"cinematic-line mx-auto mb-5"}),(0,t.jsx)("p",{className:"cinematic-text text-[16px] font-normal text-white uppercase",style:{fontFamily:"'Cormorant Garamond', 'Playfair Display', serif"},children:"Welcome to our wedding"}),(0,t.jsx)("p",{className:"cinematic-subtext text-[12px] font-normal mt-3.5",style:{fontFamily:"'Cormorant Garamond', 'Playfair Display', serif",color:"rgba(255, 255, 255, 0.6)",letterSpacing:"2px"},children:function(e){if(!e)return"";let t=new Date(e);return`${["January","February","March","April","May","June","July","August","September","October","November","December"][t.getMonth()]} ${t.getDate()}, ${t.getFullYear()}`}(e.wedding.date)})]})]}),"cover"===N&&(0,t.jsxs)("section",{className:"relative flex flex-col justify-center items-center cursor-pointer",style:{height:"100vh",overflow:"hidden",opacity:+!k,transition:"opacity 0.5s ease"},onClick:()=>{"cover"===N&&A("cover","invitation")},onTouchStart:e=>{Y.current=e.touches[0].clientY},onTouchEnd:e=>{let t=e.changedTouches[0].clientY;Y.current-t>50&&"cover"===N&&A("cover","invitation")},onWheel:e=>{e.deltaY>0&&"cover"===N&&A("cover","invitation")},children:[(0,t.jsx)("div",{className:"absolute inset-0",style:{backgroundImage:e.media.coverImage?`url(${e.media.coverImage})`:"linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",backgroundSize:"cover",backgroundPosition:"center",filter:"grayscale(100%)",opacity:+!!v,transform:v?"scale(1)":"scale(1.03)",transition:"opacity 1.1s cubic-bezier(0.22, 1, 0.36, 1), transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)"}}),(0,t.jsx)("div",{className:"absolute inset-0",style:{background:"rgba(0, 0, 0, 0.3)"}}),(0,t.jsxs)("div",{className:"relative z-10 text-center text-white px-5",children:[(0,t.jsxs)("p",{style:{fontFamily:s.displayKr,fontSize:"13px",fontWeight:300,letterSpacing:"2px",marginBottom:"16px",opacity:+!!v,transform:v?"translateY(0)":"translateY(8px)",transition:"opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s"},children:[e.groom.name," & ",e.bride.name]}),(0,t.jsx)("h1",{style:{fontFamily:"'Cormorant Garamond', serif",fontSize:"24px",fontWeight:400,letterSpacing:"6px",marginBottom:"18px",opacity:+!!v,transform:v?"translateY(0)":"translateY(8px)",transition:"opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s"},children:e.wedding.title||"OUR WEDDING"}),(0,t.jsx)("p",{style:{fontSize:"10px",fontWeight:300,letterSpacing:"4px",marginBottom:"10px",opacity:+!!v,transform:v?"translateY(0)":"translateY(8px)",transition:"opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.6s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.6s"},children:e.wedding.venue.name}),(0,t.jsxs)("p",{style:{fontFamily:s.displayKr,fontSize:"11px",fontWeight:300,letterSpacing:"1px",opacity:+!!v,transform:v?"translateY(0)":"translateY(8px)",transition:"opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.8s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.8s"},children:[function(e){if(!e)return"";let t=new Date(e),a=t.getFullYear(),s=t.getMonth()+1,i=t.getDate(),n=["일","월","화","수","목","금","토"][t.getDay()];return`${a}년 ${s}월 ${i}일 ${n}요일`}(e.wedding.date)," ",e.wedding.timeDisplay]})]}),(0,t.jsxs)("div",{className:"absolute left-1/2 -translate-x-1/2 flex flex-col items-center",style:{bottom:"50px",opacity:+!!v,transition:"opacity 0.6s ease-out 1.8s"},children:[(0,t.jsx)("div",{style:{width:"1px",height:"32px",background:"linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0))"}}),(0,t.jsx)("div",{style:{width:"4px",height:"4px",background:"rgba(255,255,255,0.8)",borderRadius:"50%",animation:v?"scrollDotMove 2.4s ease-in-out infinite 2s":"none"}})]})]}),"invitation"===N&&(0,t.jsxs)("section",{id:"invitation-section",className:`invitation-section px-7 py-10 text-center ${S?"in-view":""}`,style:{background:i.background,minHeight:"100vh",opacity:+!k,transition:"opacity 0.5s ease"},onClick:e=>{e.target.closest("button")||"invitation"===N&&n("main")},children:[(0,t.jsx)("p",{className:"invitation-title text-[10px] font-light mb-9",style:{color:i.gray,letterSpacing:"4px"},children:"INVITATION"}),e.content.quote.text&&(0,t.jsxs)("div",{className:"quote-section mb-9",children:[(0,t.jsxs)("div",{className:"flex items-center justify-center mb-5",children:[(0,t.jsx)("div",{className:"divider-bar-left h-[1px] flex-1",style:{background:i.divider}}),(0,t.jsx)("div",{className:"divider-bar-right h-[1px] flex-1",style:{background:i.divider}})]}),(0,t.jsx)("p",{className:"text-[13px] font-light leading-[1.9] mb-2",style:{fontFamily:s.displayKr,color:i.primary},dangerouslySetInnerHTML:{__html:e.content.quote.text.replace(/\n/g,"<br/>")}}),e.content.quote.author&&(0,t.jsx)("p",{className:"text-[11px] font-light mb-5",style:{color:i.gray},children:e.content.quote.author}),(0,t.jsxs)("div",{className:"flex items-center justify-center",children:[(0,t.jsx)("div",{className:"divider-bar-left h-[1px] flex-1",style:{background:i.divider,animationDelay:"0.2s"}}),(0,t.jsx)("div",{className:"divider-bar-right h-[1px] flex-1",style:{background:i.divider,animationDelay:"0.5s"}})]})]}),(0,t.jsx)("div",{className:"greeting-section mb-11",children:(0,t.jsx)("p",{className:"text-[13px] font-light leading-[2.1]",style:{fontFamily:s.displayKr,color:i.text},dangerouslySetInnerHTML:{__html:e.content.greeting?e.content.greeting.replace(/\n/g,"<br/>"):"인사말을 입력해주세요"}})}),(0,t.jsxs)("div",{className:"parents-section mb-9 text-center",style:{fontFamily:s.displayKr},children:[(0,t.jsx)("div",{className:"mb-1",children:(0,t.jsxs)("p",{className:"text-[11px] font-light leading-[1.5]",style:{color:i.text},children:[e.groom.father.name," · ",e.groom.mother.name,(0,t.jsx)("span",{style:{color:i.gray},children:" 의 아들 "}),(0,t.jsx)("span",{style:{color:i.primary,fontWeight:500},children:e.groom.name})]})}),(0,t.jsx)("div",{className:"my-2",children:(0,t.jsx)("span",{style:{color:i.primary,fontSize:"12px"},children:"♥"})}),(0,t.jsx)("div",{children:(0,t.jsxs)("p",{className:"text-[11px] font-light leading-[1.5]",style:{color:i.text},children:[e.bride.father.name," · ",e.bride.mother.name,(0,t.jsx)("span",{style:{color:i.gray},children:" 의 딸 "}),(0,t.jsx)("span",{style:{color:i.primary,fontWeight:500},children:e.bride.name})]})})]}),(0,t.jsxs)("div",{className:"wedding-info-card rounded-2xl px-6 py-7 mb-9",style:{background:i.cardBg,boxShadow:"0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)"},children:[(0,t.jsxs)("span",{className:"inline-block text-[9px] font-light px-3 py-1 rounded-full mb-5",style:{background:"#f0f0f0",color:"#888"},children:["Until wedding ",function(e){if(!e)return"";let t=new Date(e),a=new Date;a.setHours(0,0,0,0),t.setHours(0,0,0,0);let s=Math.ceil((t.getTime()-a.getTime())/864e5);return s>0?`D-${s}`:0===s?"D-Day":`D+${Math.abs(s)}`}(e.wedding.date)]}),(0,t.jsxs)("div",{className:"pb-4 mb-4 border-b border-gray-100",children:[(0,t.jsx)("p",{className:"text-lg font-light mb-1",style:{fontFamily:s.displayKr,color:i.text,letterSpacing:"3px"},children:h(e.wedding.date)}),(0,t.jsx)("p",{className:"text-[11px] font-light",style:{color:"#777"},children:e.wedding.timeDisplay})]}),(0,t.jsxs)("div",{className:"mb-5",children:[(0,t.jsxs)("p",{className:"text-xs mb-1",style:{fontFamily:s.displayKr,color:i.text,fontWeight:400},children:[e.wedding.venue.name," ",e.wedding.venue.hall]}),(0,t.jsx)("p",{className:"text-[10px] font-light",style:{color:"#999"},children:e.wedding.venue.address||"주소를 입력해주세요"})]}),(0,t.jsx)("button",{onClick:e=>{e.stopPropagation(),l(!0)},className:"px-7 py-2.5 border border-gray-300 rounded-md text-[10px] font-light",style:{color:"#666"},children:"오시는 길"})]}),(0,t.jsxs)("div",{className:"next-story-section flex flex-col items-center",children:[(0,t.jsx)("button",{onClick:e=>{e.stopPropagation(),n("main")},className:"text-[11px] font-light",style:{color:i.gray},children:"Next Story"}),(0,t.jsxs)("div",{className:"flex flex-col items-center mt-4",children:[(0,t.jsx)("div",{style:{width:"1px",height:"32px",background:`linear-gradient(to bottom, ${i.gray}60, transparent)`}}),(0,t.jsx)("div",{style:{width:"4px",height:"4px",background:i.gray,borderRadius:"50%",animation:"scrollDotMove 2.4s ease-in-out infinite"}})]})]})]}),o&&(0,t.jsxs)("div",{className:"fixed inset-0 z-50 flex items-end justify-center",children:[(0,t.jsx)("div",{className:"absolute inset-0 bg-black/50",onClick:()=>l(!1)}),(0,t.jsxs)("div",{className:"relative w-full max-w-lg rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto",style:{background:i.cardBg},children:[(0,t.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[(0,t.jsx)("h3",{className:"text-lg font-medium",style:{color:i.text},children:"오시는 길"}),(0,t.jsx)("button",{onClick:()=>l(!1),className:"p-2 rounded-full hover:bg-gray-100",children:(0,t.jsx)("svg",{className:"w-5 h-5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]}),(0,t.jsxs)("div",{className:"mb-6 p-4 rounded-xl",style:{background:i.sectionBg},children:[(0,t.jsxs)("p",{className:"text-sm font-medium mb-1",style:{color:i.text},children:[e.wedding.venue.name," ",e.wedding.venue.hall]}),(0,t.jsx)("p",{className:"text-xs",style:{color:i.gray},children:e.wedding.venue.address})]}),(0,t.jsx)("div",{className:"flex gap-2 mb-6 overflow-x-auto pb-2",children:M.map(e=>(0,t.jsx)("button",{onClick:()=>d(e.key),className:`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${c===e.key?"text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`,style:c===e.key?{background:i.primary}:{},children:e.label},e.key))}),(0,t.jsxs)("div",{className:"space-y-4",children:["car"===c&&I.car&&(0,t.jsxs)("div",{className:"space-y-3",children:[I.car.desc&&(0,t.jsxs)("div",{className:"p-4 rounded-xl bg-gray-50",children:[(0,t.jsx)("p",{className:"text-xs font-medium mb-1",style:{color:i.gray},children:"네비게이션"}),(0,t.jsx)("p",{className:"text-sm",style:{color:i.text},children:I.car.desc})]}),I.car.route&&(0,t.jsxs)("div",{className:"p-4 rounded-xl bg-gray-50",children:[(0,t.jsx)("p",{className:"text-xs font-medium mb-1",style:{color:i.gray},children:"경로 안내"}),(0,t.jsx)("p",{className:"text-sm",style:{color:i.text},children:I.car.route})]})]}),"subway"===c&&I.subway&&(0,t.jsx)("div",{className:"space-y-2",children:I.subway.map((e,a)=>(0,t.jsx)("div",{className:"p-4 rounded-xl bg-gray-50",children:(0,t.jsx)("p",{className:"text-sm",style:{color:i.text},children:e})},a))}),"bus"===c&&I.bus&&(0,t.jsxs)("div",{className:"space-y-3",children:[I.bus.main&&I.bus.main.length>0&&(0,t.jsxs)("div",{className:"p-4 rounded-xl bg-gray-50",children:[(0,t.jsx)("p",{className:"text-xs font-medium mb-2",style:{color:i.gray},children:"간선버스"}),(0,t.jsx)("div",{className:"flex flex-wrap gap-2",children:I.bus.main.map((e,a)=>(0,t.jsx)("span",{className:"px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700",children:e},a))})]}),I.bus.branch&&I.bus.branch.length>0&&(0,t.jsxs)("div",{className:"p-4 rounded-xl bg-gray-50",children:[(0,t.jsx)("p",{className:"text-xs font-medium mb-2",style:{color:i.gray},children:"지선버스"}),(0,t.jsx)("div",{className:"flex flex-wrap gap-2",children:I.bus.branch.map((e,a)=>(0,t.jsx)("span",{className:"px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700",children:e},a))})]})]}),"parking"===c&&I.parking&&(0,t.jsxs)("div",{className:"space-y-3",children:[I.parking.location&&(0,t.jsxs)("div",{className:"p-4 rounded-xl bg-gray-50",children:[(0,t.jsx)("p",{className:"text-xs font-medium mb-1",style:{color:i.gray},children:"주차장 위치"}),(0,t.jsx)("p",{className:"text-sm",style:{color:i.text},children:I.parking.location})]}),I.parking.fee&&(0,t.jsxs)("div",{className:"p-4 rounded-xl bg-gray-50",children:[(0,t.jsx)("p",{className:"text-xs font-medium mb-1",style:{color:i.gray},children:"주차 요금"}),(0,t.jsx)("p",{className:"text-sm",style:{color:i.text},children:I.parking.fee})]})]})]}),(0,t.jsxs)("div",{className:"flex gap-3 mt-6",children:[(0,t.jsx)("button",{className:"flex-1 py-3 rounded-xl text-sm font-medium text-white",style:{background:"#03C75A"},onClick:()=>window.open(`https://map.naver.com/v5/search/${encodeURIComponent(e.wedding.venue.address)}`,"_blank"),children:"네이버 지도"}),(0,t.jsx)("button",{className:"flex-1 py-3 rounded-xl text-sm font-medium text-black",style:{background:"#FEE500"},onClick:()=>window.open(`https://map.kakao.com/?q=${encodeURIComponent(e.wedding.venue.address)}`,"_blank"),children:"카카오맵"})]})]})]}),"invitation"===N&&(0,t.jsx)("div",{className:"fixed z-50 transition-all duration-300",style:{bottom:"80px",right:"8px",opacity:+!!C,visibility:C?"visible":"hidden",transform:C?"translateY(0)":"translateY(10px)"},children:(0,t.jsxs)("div",{className:"relative px-4 py-2.5 rounded-2xl text-xs text-gray-700 whitespace-nowrap",style:{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.15)",fontFamily:"'Noto Sans KR', sans-serif"},children:["결혼식 정보는 여기에서",(0,t.jsx)("div",{className:"absolute",style:{bottom:"-8px",right:"20px",width:"0",height:"0",borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:"10px solid #fff",filter:"drop-shadow(0 2px 2px rgba(0,0,0,0.1))"}})]})})]})}function v({invitation:e,fonts:s,themeColors:i,onNavigate:n,onOpenRsvp:r}){let o,l,[y,u]=(0,a.useState)(0);return(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsxs)("button",{onClick:()=>n("intro"),className:"fixed top-4 left-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-light",style:{background:"rgba(255,255,255,0.9)",color:i.gray,boxShadow:"0 2px 8px rgba(0,0,0,0.1)"},children:[(0,t.jsx)("svg",{className:"w-3 h-3",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 19l-7-7 7-7"})}),"Intro"]}),(0,t.jsxs)("section",{className:"relative h-[200px] flex items-end justify-center",style:{backgroundImage:e.media.coverImage?`url(${e.media.coverImage})`:"linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",backgroundSize:"cover",backgroundPosition:"center"},children:[(0,t.jsx)("div",{className:"absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"}),(0,t.jsx)("div",{className:"relative z-10 text-center text-white pb-8",children:(0,t.jsxs)("p",{className:"text-xs font-light",style:{fontFamily:s.displayKr,letterSpacing:"1.5px"},children:[e.groom.name," & ",e.bride.name,(0,t.jsx)("br",{}),"Getting Married"]})})]}),(0,t.jsx)(d,{lines:[`${e.groom.name} & ${e.bride.name}`,"Getting Married"],dividerColor:i.divider,fontFamily:s.displayKr,textColor:i.text,bgColor:i.cardBg,isChapterBreak:!0}),e.sectionVisibility?.coupleProfile!==!1&&e.bride.profile.intro&&(0,t.jsx)("div",{className:"relative w-full h-[60px] overflow-hidden",style:{background:i.cardBg},children:(0,t.jsxs)("svg",{viewBox:"0 0 2880 120",preserveAspectRatio:"none",className:"absolute bottom-0 w-[250%] h-full",style:{left:"-5%"},children:[(0,t.jsx)("path",{className:"wave-back",d:"M0,40 Q180,80 360,40 T720,40 T1080,40 T1440,40 T1800,40 T2160,40 T2520,40 T2880,40 L2880,120 L0,120 Z",style:{fill:i.sectionBg,opacity:.3,animation:"waveBack 8s ease-in-out infinite"}}),(0,t.jsx)("path",{className:"wave-mid",d:"M0,50 Q240,90 480,50 T960,50 T1440,50 T1920,50 T2400,50 T2880,50 L2880,120 L0,120 Z",style:{fill:i.sectionBg,opacity:.5,animation:"waveMid 6s ease-in-out infinite"}}),(0,t.jsx)("path",{className:"wave-front",d:"M0,70 Q360,100 720,70 T1440,70 T2160,70 T2880,70 L2880,120 L0,120 Z",style:{fill:i.sectionBg,animation:"waveFront 7s ease-in-out infinite"}})]})}),e.sectionVisibility?.coupleProfile!==!1&&e.bride.profile.intro&&(0,t.jsx)(m,{profile:e.bride.profile,fonts:s,themeColors:i,bgColor:i.sectionBg}),e.sectionVisibility?.coupleProfile!==!1&&e.groom.profile.intro&&(0,t.jsx)(m,{profile:e.groom.profile,fonts:s,themeColors:i,bgColor:i.sectionBg}),e.sectionVisibility?.ourStory!==!1&&e.relationship.stories.some(e=>e.title||e.desc)&&(0,t.jsx)(d,{lines:["Beginning of Love","Our Moments"],dividerColor:i.divider,fontFamily:s.displayKr,textColor:i.text,bgColor:i.cardBg,isChapterBreak:!0}),e.sectionVisibility?.ourStory!==!1&&e.relationship.stories.map((e,a)=>e.title||e.desc?(0,t.jsx)(g,{story:e,fonts:s,themeColors:i},a):null),e.sectionVisibility?.ourStory!==!1&&e.relationship.startDate&&(o=function(e){if(!e)return{days:0,weeks:0,yearsMonths:"0년 0개월"};let t=new Date(e),a=new Date;t.setHours(0,0,0,0),a.setHours(0,0,0,0);let s=Math.floor((a.getTime()-t.getTime())/864e5)+1,i=Math.floor(s/7),n=a.getFullYear()-t.getFullYear(),r=a.getMonth()-t.getMonth();return a.getDate()<t.getDate()&&r--,r<0&&(n--,r+=12),{days:s,weeks:i,yearsMonths:`${n}년 ${r}개월`}}(e.relationship.startDate),l=e.relationship.closingText||"그리고 이제 드디어 부르는 서로의 이름에 '신랑', '신부'라는 호칭을 담습니다.",(0,t.jsxs)(c,{className:"py-14 px-7 text-center",style:{background:`linear-gradient(180deg, ${i.sectionBg} 0%, ${i.cardBg} 100%)`},children:[(0,t.jsxs)("div",{className:"flex justify-center items-baseline gap-8 mb-10",children:[(0,t.jsx)("div",{className:"text-center",children:(0,t.jsxs)("p",{className:"text-[16px] font-normal",style:{fontFamily:s.displayKr,color:i.text},children:[o.days.toLocaleString(),(0,t.jsx)("span",{className:"text-[10px] font-light ml-0.5",style:{color:i.gray},children:"일"})]})}),(0,t.jsx)("div",{className:"text-center",children:(0,t.jsxs)("p",{className:"text-[16px] font-normal",style:{fontFamily:s.displayKr,color:i.text},children:[o.weeks.toLocaleString(),(0,t.jsx)("span",{className:"text-[10px] font-light ml-0.5",style:{color:i.gray},children:"주"})]})}),(0,t.jsx)("div",{className:"text-center",children:(0,t.jsx)("p",{className:"text-[16px] font-normal",style:{fontFamily:s.displayKr,color:i.text},children:o.yearsMonths})})]}),(0,t.jsx)("div",{className:"w-px h-5 mx-auto mb-7",style:{background:i.divider}}),(0,t.jsx)("p",{className:"text-[11px] font-light leading-[2]",style:{fontFamily:s.displayKr,color:i.gray},dangerouslySetInnerHTML:{__html:l.replace(/\n/g,"<br/>")}})]})),(0,t.jsx)(c,{className:"px-5 py-10",style:{background:i.cardBg},children:(0,t.jsx)("div",{className:"grid grid-cols-2 gap-2",children:e.gallery.images&&e.gallery.images.length>0?e.gallery.images.map((e,a)=>(0,t.jsx)("div",{className:"aspect-square rounded overflow-hidden",children:(0,t.jsx)("div",{className:"w-full h-full bg-cover bg-center bg-gray-100",style:{backgroundImage:e?`url(${e})`:void 0}})},a)):[1,2,3,4,5,6].map(e=>(0,t.jsx)("div",{className:"aspect-square rounded bg-gray-100 flex items-center justify-center",children:(0,t.jsx)("svg",{className:"w-6 h-6 text-gray-300",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1.5,d:"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"})})},e))})}),e.sectionVisibility?.interview!==!1&&e.content.interviews.some(e=>e.question||e.answer)&&(0,t.jsx)(d,{lines:["About Marriage","Our Story"],dividerColor:i.divider,fontFamily:s.displayKr,textColor:i.text,bgColor:i.cardBg,isChapterBreak:!0}),e.sectionVisibility?.interview!==!1&&e.content.interviews.map((e,a)=>e.question||e.answer?(0,t.jsx)(x,{interview:e,fonts:s,themeColors:i,bgColor:a%2==0?i.sectionBg:i.cardBg},a):null),(0,t.jsxs)("section",{className:"px-6 py-14",style:{background:`linear-gradient(180deg, ${i.sectionBg} 0%, ${i.background} 100%)`},children:[e.media.infoImage&&(0,t.jsx)(c,{className:"mb-10",children:(0,t.jsx)("div",{className:"w-full aspect-[4/5] rounded-2xl bg-cover bg-center",style:{backgroundImage:`url(${e.media.infoImage})`,boxShadow:"0 4px 12px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08)"}})}),(0,t.jsxs)(c,{className:"text-center mb-8",children:[(0,t.jsx)("h3",{className:"text-[15px] relative inline-block",style:{fontFamily:s.displayKr,color:i.text,fontWeight:400},children:"행복한 시간을 위한 안내"}),(0,t.jsx)("div",{className:"w-10 h-px mx-auto mt-4",style:{background:i.divider}})]}),e.content.info.dressCode.enabled&&(0,t.jsx)(p,{title:e.content.info.dressCode.title,content:e.content.info.dressCode.content,fonts:s,themeColors:i}),e.content.info.photoShare.enabled&&(0,t.jsx)(p,{title:e.content.info.photoShare.title,content:e.content.info.photoShare.content,buttonText:e.content.info.photoShare.buttonText,buttonUrl:e.content.info.photoShare.url,fonts:s,themeColors:i})]}),(0,t.jsxs)(c,{className:"min-h-[300px] flex flex-col justify-center items-center text-center px-7 py-20",style:{background:i.sectionBg},children:[(0,t.jsx)("h2",{className:"text-lg mb-7",style:{fontFamily:s.display,color:i.text,fontWeight:400,letterSpacing:"4px"},children:e.content.thankYou.title}),e.content.thankYou.message?(0,t.jsx)("p",{className:"text-[11px] font-light leading-[2.2] mb-7",style:{fontFamily:s.displayKr,color:i.text},dangerouslySetInnerHTML:{__html:e.content.thankYou.message.replace(/\n/g,"<br/>")}}):(0,t.jsx)("p",{className:"text-[11px] text-gray-400 italic mb-7",children:"감사 메시지를 입력해주세요"}),e.content.thankYou.sign&&(0,t.jsx)("p",{className:"text-[11px] font-light",style:{fontFamily:s.displayKr,color:i.gray},children:e.content.thankYou.sign})]}),(0,t.jsx)("div",{className:"relative w-full h-[60px] overflow-hidden",style:{background:i.sectionBg},children:(0,t.jsxs)("svg",{viewBox:"0 0 2880 120",preserveAspectRatio:"none",className:"absolute bottom-0 w-[250%] h-full",style:{left:"-5%"},children:[(0,t.jsx)("path",{className:"wave-back",d:"M0,40 Q180,80 360,40 T720,40 T1080,40 T1440,40 T1800,40 T2160,40 T2520,40 T2880,40 L2880,120 L0,120 Z",style:{fill:i.cardBg,opacity:.3,animation:"waveBack 8s ease-in-out infinite"}}),(0,t.jsx)("path",{className:"wave-mid",d:"M0,50 Q240,90 480,50 T960,50 T1440,50 T1920,50 T2400,50 T2880,50 L2880,120 L0,120 Z",style:{fill:i.cardBg,opacity:.5,animation:"waveMid 6s ease-in-out infinite"}}),(0,t.jsx)("path",{className:"wave-front",d:"M0,70 Q360,100 720,70 T1440,70 T2160,70 T2880,70 L2880,120 L0,120 Z",style:{fill:i.cardBg,animation:"waveFront 7s ease-in-out infinite"}})]})}),e.sectionVisibility?.guestbook!==!1&&(0,t.jsxs)(c,{className:"px-5 py-14 pb-20 text-center",style:{background:i.cardBg},children:[(0,t.jsx)("h3",{className:"text-sm mb-7",style:{fontFamily:s.displayKr,color:i.text,fontWeight:400},children:"Guestbook"}),(0,t.jsxs)("div",{className:"max-w-[300px] mx-auto mb-9",children:[(0,t.jsx)("p",{className:"text-xs font-light leading-[1.7] mb-4 min-h-[40px]",style:{fontFamily:s.displayKr,color:i.text},children:e.content.guestbookQuestions[y]||"두 사람에게 하고 싶은 말을 남겨주세요"}),(0,t.jsxs)("div",{className:"flex gap-2 mb-2.5",children:[(0,t.jsx)("input",{type:"text",className:"flex-1 px-3.5 py-3 border border-gray-200 rounded-lg text-[11px] font-light",style:{background:"#fafafa",color:i.text},placeholder:"20자 이내"}),(0,t.jsx)("button",{className:"px-4 py-3 rounded-lg text-[10px] font-light text-white",style:{background:i.text},children:"등록"})]}),e.content.guestbookQuestions.length>1&&(0,t.jsx)("button",{onClick:()=>{let t=e.content.guestbookQuestions;t.length>0&&u(e=>(e+1)%t.length)},className:"text-[10px] font-light cursor-pointer hover:underline active:opacity-70 transition-all",style:{color:i.primary},children:"다른 질문 보기 →"})]}),(0,t.jsxs)("div",{className:"relative min-h-[200px]",children:[(0,t.jsxs)("div",{className:"absolute w-[130px] px-3 py-3.5 bg-[#FFF9F0] rounded-lg text-left shadow-sm",style:{transform:"rotate(-3deg)",top:"10px",left:"20px"},children:[(0,t.jsx)("p",{className:"text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]",children:"두 사람에게 하고 싶은 말?"}),(0,t.jsx)("p",{className:"text-[11px] font-light leading-[1.6]",style:{fontFamily:s.displayKr,color:i.text},children:"행복하세요!"})]}),(0,t.jsxs)("div",{className:"absolute w-[130px] px-3 py-3.5 bg-[#F0F7FF] rounded-lg text-left shadow-sm",style:{transform:"rotate(2deg)",top:"80px",right:"20px"},children:[(0,t.jsx)("p",{className:"text-[9px] font-light text-gray-400 mb-1.5 leading-[1.4]",children:"결혼생활에서 가장 중요한 건?"}),(0,t.jsx)("p",{className:"text-[11px] font-light leading-[1.6]",style:{fontFamily:s.displayKr,color:i.text},children:"서로를 믿는 것"})]})]})]}),e.rsvpEnabled&&(0,t.jsxs)(c,{className:"px-6 py-14 text-center",style:{background:i.cardBg},children:[(0,t.jsx)("p",{className:"text-[10px] font-light mb-6",style:{color:i.gray,letterSpacing:"4px"},children:"RSVP"}),(0,t.jsx)("p",{className:"text-sm mb-4",style:{color:"#666"},children:"참석 여부를 알려주세요"}),(0,t.jsx)("button",{onClick:()=>r?.(),className:"w-full py-3 rounded-lg text-xs",style:{background:i.primary,color:"#fff"},children:"참석 여부 전달하기"}),e.rsvpDeadline&&(0,t.jsxs)("p",{className:"text-[10px] font-light mt-3",style:{color:"#999"},children:["마감일: ",h(e.rsvpDeadline)]})]}),(0,t.jsxs)("div",{className:"px-6 py-10 text-center",style:{background:i.background},children:[(0,t.jsx)("p",{className:"text-[10px] font-light",style:{color:"#999"},children:"Thank you for celebrating with us"}),(0,t.jsx)("p",{className:"text-[9px] font-light mt-2",style:{color:"#ccc"},children:"Made with dear drawer"})]})]})}function j(){let e=(0,s.useParams)().slug,[n]=(0,a.useState)(f),[l,c]=(0,a.useState)("intro"),[d,m]=(0,a.useState)("cover"),p=(0,a.useRef)(null),[x,g]=(0,a.useState)("none"),h=y[n.colorTheme],j=u[n.fontStyle],N="main"===l&&!!n.media.bgm;(0,a.useEffect)(()=>{console.log("Loading invitation for slug:",e)},[e]),(0,a.useEffect)(()=>{"main"===l?window.scrollTo(0,200):window.scrollTo(0,0)},[l]);let w=[n.groom.phone&&{name:n.groom.name,phone:n.groom.phone,role:"신랑",side:"groom"},n.groom.father.phone&&{name:n.groom.father.name,phone:n.groom.father.phone,role:"아버지",side:"groom"},n.groom.mother.phone&&{name:n.groom.mother.name,phone:n.groom.mother.phone,role:"어머니",side:"groom"},n.bride.phone&&{name:n.bride.name,phone:n.bride.phone,role:"신부",side:"bride"},n.bride.father.phone&&{name:n.bride.father.name,phone:n.bride.father.phone,role:"아버지",side:"bride"},n.bride.mother.phone&&{name:n.bride.mother.name,phone:n.bride.mother.phone,role:"어머니",side:"bride"}].filter(Boolean),k=[{name:n.groom.name,bank:n.groom.bank,role:"신랑",side:"groom"},{name:n.bride.name,bank:n.bride.bank,role:"신부",side:"bride"}];return(0,t.jsxs)("div",{className:"min-h-screen overflow-x-hidden",style:{backgroundColor:h.background,fontFamily:j.body,color:h.text},children:[(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:o}}),"intro"===l?(0,t.jsx)(b,{invitation:n,fonts:j,themeColors:h,onNavigate:c,onScreenChange:m}):(0,t.jsx)(v,{invitation:n,fonts:j,themeColors:h,onNavigate:c,onOpenRsvp:()=>g("rsvp")}),("main"===l||"intro"===l&&"invitation"===d)&&(0,t.jsx)(i.default,{themeColors:h,fonts:j,openModal:x,onModalClose:()=>g("none"),invitation:{venue_name:n.wedding.venue.name,venue_address:n.wedding.venue.address,contacts:w,accounts:k,directions:n.wedding.directions,rsvpEnabled:n.rsvpEnabled,rsvpAllowGuestCount:n.rsvpAllowGuestCount,invitationId:n.id}}),(0,t.jsx)(r,{audioRef:p,isVisible:N,shouldAutoPlay:"main"===l}),n.media.bgm&&(0,t.jsx)("audio",{ref:p,loop:!0,preload:"auto",children:(0,t.jsx)("source",{src:n.media.bgm,type:"audio/mpeg"})})]})}e.s(["default",()=>j])}]);