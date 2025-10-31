"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Lang = "he" | "ru"

type Translations = Record<string, { he: string; ru: string }>

const translations: Translations = {
  "header.home": { he: "דף הבית", ru: "Главная" },
  "header.desserts": { he: "כל הקינוחים", ru: "Все десерты" },
  "header.contact": { he: "צור קשר", ru: "Контакты" },
  "header.login": { he: "התחברות", ru: "Вход" },
  "header.register": { he: "הרשמה", ru: "Регистрация" },
  "header.profile": { he: "הפרופיל שלי", ru: "Мой профиль" },
  "header.orders": { he: "ההזמנות שלי", ru: "Мои заказы" },
  "header.admin": { he: "ניהול החנות", ru: "Управление" },
  "header.greeting": { he: "שלום", ru: "Здравствуйте" },

  "hero.title": { he: "קינוחים מעוצבים ומגשי אירוח", ru: "Дизайнерские десерты и фуршетные сеты" },
  "hero.desc": { he: "אנו מתמחים ביצירת קינוחים מעוצבים ייחודיים לימי הולדת, חתונות, בר/בת מצווה וכל אירוע מיוחד.", ru: "Мы создаем уникальные дизайнерские десерты для дней рождения, свадеб и любых особых событий." },
  "hero.orderNow": { he: "הזמנה עכשיו", ru: "Заказать сейчас" },
  "hero.contact": { he: "צרו קשר", ru: "Связаться" },

  "featured.new": { he: "חדש על המדף!", ru: "Новинки" },
  "featured.noFeatured": { he: "לא נמצאו קינוחים מומלצים", ru: "Рекомендуемые десерты не найдены" },
  "featured.promos": { he: "מבצעים", ru: "Акции" },
  "featured.noPromos": { he: "לא נמצאו מבצעים", ru: "Акции не найдены" },
  "featured.viewAll": { he: "צפה בכל הקינוחים", ru: "Просмотреть все десерты" },
  "featured.addedToCart": { he: "התווסף לסל", ru: "Добавлено в корзину" },
  "featured.comingSoon": { he: "בקרוב..", ru: "Скоро..." },
  "featured.cart": { he: "הוסף לסל", ru: "В корзину" },
  "featured.newOrder": { he: "הזמנה חדשה", ru: "Новый заказ" },
  "featured.new.badge": { he: "חדש", ru: "Новое" },
  "featured.kgUnit": { he: "ק\"ג", ru: "кг" },
  "featured.promo.badge": { he: "מבצע", ru: "Акция" },

  "errors.notFound": { he: "לא נמצא", ru: "Не найдено" },
  "errors.loading": { he: "טוען...", ru: "Загрузка..." },
  "errors.loadingError": { he: "שגיאה בטעינת הנתונים", ru: "Ошибка загрузки данных" },
  "errors.formError": { he: "שגיאה בטופס", ru: "Ошибка формы" },
  "errors.title": { he: "שגיאה", ru: "Ошибка" },
  "errors.cartError": { he: "שגיאה בעגלת הקניות", ru: "Ошибка корзины" },
  "featured.enlargedImage": { he: "תמונה מוגדלת של קינוח", ru: "Увеличенное изображение десерта" },

  // categories
  "categories.birthday.name": { he: "עוגות יום הולדת מעוצבות", ru: "Торты на день рождения" },
  "categories.birthday.desc": { he: "הפכו את החגיגה שלכם למיוחדת", ru: "Сделайте ваш праздник особенным" },
  "categories.cakebox.name": { he: "Cake-Box", ru: "Cake-Box" },
  "categories.cakebox.desc": { he: "הקינוח החדש שלנו", ru: "Наш новый десерт" },
  "categories.free.name": { he: "קינוחים ללא גלוטן/סוכר", ru: "Десерты без глютена/сахара" },
  "categories.free.desc": { he: "בריא זה הטעים החדש", ru: "Здорово — вкусно" },
  "categories.hosting.name": { he: "מגשי אירוח", ru: "Фуршетные блюда" },
  "categories.hosting.desc": { he: "שדרגו את האירוע שלכם", ru: "Улучшите ваше событие" },
}

const LanguageContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}>({
  lang: "he",
  setLang: () => {},
  t: (k: string) => k,
})

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "he"
    const saved = localStorage.getItem("lang") as Lang | null
    return saved || "he"
  })

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang)
    } catch (e) {
      // ignore
    }
    // set html lang and dir
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "he" ? "he" : "ru"
      document.documentElement.dir = lang === "he" ? "rtl" : "ltr"
    }
  }, [lang])

  const t = (key: string) => {
    const entry = translations[key]
    if (!entry) return key
    return lang === "he" ? entry.he : entry.ru
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
