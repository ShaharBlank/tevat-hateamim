import Link from "next/link"
import Image from "next/image"

const categories = [
  {
    id: "birthday",
    name: "קינוחי יום הולדת",
    description: "הפכו את החגיגה שלכם למיוחדת",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "wedding",
    name: "קינוחי חתונה",
    description: "עיצובים אלגנטיים ליום הגדול שלכם",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "custom",
    name: "קינוחים מותאמים אישית",
    description: "מעוצבים במיוחד עבורכם",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: "cupcakes",
    name: "קאפקייקס",
    description: "חטיפים מושלמים בגודל ביס",
    image: "/placeholder.svg?height=300&width=300",
  },
]

export default function DessertCategories() {
  return (
    <section className="py-16">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href="/desserts"
              className="group block overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                  <p className="mt-1 text-sm text-gray-200">{category.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

