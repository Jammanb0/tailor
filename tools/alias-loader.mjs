// `@/` 별칭을 node에서도 풀어 주는 최소 로더.
//
// 왜: 라우팅·오류 분류 모듈은 앱 코드라 `@/data/...`를 쓴다. node 스크립트는
// tsconfig의 paths를 모르므로 그대로 import하면 깨진다. 지금까지는 그래서
// 개발 전용 HTTP 라우트를 거쳐 검사했는데, 순수 함수까지 서버를 띄워야
// 확인할 수 있었다. 이 훅은 지정자만 바꾸고 나머지는 node 기본 동작에 맡긴다.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-hooks.mjs", pathToFileURL(import.meta.filename));
