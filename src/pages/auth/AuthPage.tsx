import { Button } from "primereact/button";

type AuthPageProps = {
  onGoogle?: () => void;
  onSlush?: () => void; // Placeholder for your Slush auth handler
};

export default function AuthPage({ onGoogle, onSlush }: AuthPageProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1">Hesabına giriş yap</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Devam etmek için aşağıdaki yöntemlerden birini seç.
        </p>
      </div>

      <div className="grid gap-3">
        <Button
          className="w-full justify-center font-medium h-12"
          style={{ backgroundColor: "#6B46C1", borderColor: "#6B46C1", color: "#fff" }}
          onClick={onGoogle}
        >
          <i className="pi pi-google" />
          &nbsp;Google ile devam et
        </Button>
        <Button
          className="w-full justify-center font-medium h-12"
          style={{ backgroundColor: "#6B46C1", borderColor: "#6B46C1", color: "#fff" }}
          onClick={onSlush}
        >
          <i className="pi pi-bolt" />
          Slush ile devam et
        </Button>
        <Button
          label="Google ile devam et"
          icon="pi pi-google"
          className="w-full justify-center font-medium h-12"
          outlined
          onClick={onGoogle}
          style={{ borderColor: "#6B46C1", color: "#6B46C1" }}
        />
      </div>

      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        Devam ederek Hizmet Şartlarımızı ve Gizlilik Politikamızı kabul etmiş olursun.
      </div>
    </div>
  );
}


