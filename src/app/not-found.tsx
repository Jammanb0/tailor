import Link from "next/link";

// 없는 주소로 들어왔을 때 뜨는 화면. 기본 404 화면은 앱 테마(html의
// data-theme)를 읽지 않아 다크 모드에서 흰 화면이 튄다.
export default function NotFound() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					여기는 없는 주소예요
				</h1>
				<div className="mx-auto mt-3 h-0 w-24 border-t-2 border-accent border-dashed" />
			</div>
			<p className="max-w-md text-muted">
				주소가 바뀌었거나 잘못 눌렀을 수 있어요.
			</p>
			<div className="flex flex-wrap justify-center gap-3">
				<Link
					href="/"
					className="flex items-center justify-center rounded-full bg-accent px-6 py-3 text-center text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
				>
					처음으로
				</Link>
				<Link
					href="/create"
					className="flex items-center justify-center rounded-full border border-border px-6 py-3 text-center text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
				>
					스킬 만들기
				</Link>
			</div>
		</main>
	);
}
