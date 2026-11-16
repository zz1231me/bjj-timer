# BJJ Timer

주짓수 도장용 스파링/대기 라운드 타이머. GitHub Pages 웹앱 + Android WebView 앱.

**Live**: https://zz1231me.github.io/bjj-timer/

## 기능

- 프리셋 기반 타이머 (스파링 시간, 대기 시간, 경고 카운트다운 설정)
- 무한 루프: 스파링 → 대기 → 스파링 반복
- 상태별 색상: 스파링(노랑), 대기(파랑), 경고(주황 펄스)
- 두 줄 카운트다운 (X분 / SS), 60초 이하에서 큰 단일 숫자로 전환
- 10초 미만 째깍 소리 + 진동
- 부저 4종류: 삐(고음), 부저(저음), 삑삑(더블), 벨(띵)
- 시작음(1초) / 종료음(2초) 구분
- 운영 스케줄 (시작~종료 시간 설정)
- localStorage로 기기별 설정 저장

## 프로젝트 구조

```
timer/
├── index.html              # 메인 HTML (대시보드, 타이머, 프리셋 편집, 설정)
├── manifest.json            # PWA manifest
├── css/
│   └── style.css            # 전체 스타일 (상태별 색상, 반응형 폰트)
├── js/
│   ├── app.js               # 메인 앱 (화면 전환, UI 업데이트, 이벤트)
│   ├── timer.js             # 타이머 엔진 (IDLE/RUNNING/PAUSED/RESTING 상태 머신)
│   ├── settings.js          # 프리셋 및 앱 설정 관리 (localStorage)
│   ├── sound.js             # Web Audio API 부저 합성 (4종류 × 시작/종료)
│   └── bridge.js            # Android WebView 브릿지 + 웹 폴백
└── android/
    ├── app/
    │   └── src/main/
    │       ├── java/com/bjjtimer/app/
    │       │   ├── MainActivity.kt        # WebView + 풀스크린 + 화면 꺼짐 방지
    │       │   └── WebAppInterface.kt     # JS ↔ Kotlin 브릿지
    │       ├── res/
    │       └── AndroidManifest.xml
    ├── build.gradle.kts
    └── settings.gradle.kts
```

## 기술 스택

- **웹**: HTML/CSS/JS (프레임워크 없음), Web Audio API, Nanum Gothic 폰트
- **Android**: Kotlin, WebView, `https://zz1231me.github.io/bjj-timer/` 로드
- **배포**: GitHub Pages (main 브랜치 루트)

## 디자인

- 순수 검정 배경 (`#000`), 노랑/파랑 액센트
- 반응형 폰트: `min(vw, px)` 사용, 화면 비율에 맞게 자동 조정
- 상/하 프로그래스바 (24px)
- 상태 라벨 없이 색상으로만 구분
