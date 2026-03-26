export default function App() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#F9FAFB] text-[#2B3541]">
      <div className="max-w-[440px] w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-6">Hello Tailwind v4</h1>

        <button
          className="
            rounded-xl border-2 border-[#2B3541]
            px-6 py-3 text-lg font-medium
            bg-white text-[#2B3541]
            shadow-[0_5px_0_#2B3541]
            transition-all duration-150
            active:translate-y-[5px] active:shadow-none
          "
        >
          ボタンのサンプル
        </button>
      </div>
    </div>
  );
}