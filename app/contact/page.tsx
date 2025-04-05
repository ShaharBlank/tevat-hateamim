import Link from "next/link"
import { Facebook, Instagram, Phone } from "lucide-react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">צור קשר</h1>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-semibold mb-4">דברו איתנו</h2>
              <p className="text-gray-600 mb-6">
                אנחנו תמיד שמחים לשמוע מכם! בין אם יש לכם שאלה, בקשה מיוחדת או רק רוצים להגיד שלום, אל תהססו ליצור איתנו
                קשר.
              </p>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 flex items-center">
                    <Phone className="h-5 w-5 ml-3 text-primary" />
                    <div>
                      <h3 className="font-medium">טלפון</h3>
                      <p className="text-gray-600">
                        <a href="tel:+972555562540" className="hover:text-primary">
                          055-556-2540
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">עקבו אחרינו</h3>
                <div className="flex space-x-4">
                  <Link
                    href="https://www.facebook.com/profile.php?id=61572832396919"
                    target="_blank"
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </Link>
                  <Link
                    href="https://api.whatsapp.com/send?phone=%2B972555562540"
                    target="_blank"
                    className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </Link>
                  <Link
                    href="https://www.tiktok.com/@tevatteamim"
                    target="_blank"
                    className="bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                    </svg>
                  </Link>
                  <Link
                    href="https://www.instagram.com/tevatteamim"
                    target="_blank"
                    className="bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-700 text-white p-3 rounded-full hover:opacity-90 transition-colors"
                  >
                    <Instagram className="h-6 w-6" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">שעות פעילות</h2>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="font-medium">ראשון - חמישי</span>
                  <span>9:00 - 19:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">שישי</span>
                  <span>9:00 - 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">שבת</span>
                  <span>סגור</span>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">הזמנות מיוחדות</h3>
                <p className="text-gray-600 mb-4">לעוגות מעוצבות והזמנות מיוחדות, אנא צרו קשר לפחות 3 ימים מראש.</p>
                <Button className="w-full">
                  <a href="tel:+972555562540" className="w-full">
                    התקשרו עכשיו
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center">המיקום שלנו</h2>
            <div className="aspect-video relative rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d54601.12757500312!2d34.75817535!3d31.25181735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15026640029f8777%3A0x8dee8012deb5dd8!2sBe&#39;er%20Sheva!5e0!3m2!1sen!2sil!4v1617000000000!5m2!1sen!2sil"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="absolute inset-0"
              ></iframe>
            </div>
            <p className="text-center mt-4 text-gray-600">באר שבע, ישראל</p>
          </div>
        </div>
      </main>
    </div>
  )
}

