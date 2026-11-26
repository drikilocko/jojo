import Flight from './components/Flight.jsx'
import SiteHeader from './components/SiteHeader.jsx'
import Scrollbar from './components/Scrollbar.jsx'
import { Services, About, Features, Network, Contact, Footer } from './components/Sections.jsx'

export default function App() {
  return (
    <>
      <Flight />
      {/* header global : réapparaît au scroll vers le haut, une fois la section 1 passée */}
      <SiteHeader />
      {/* fondu entre le crème de la section 1 et le blanc de la suite */}
      <div className="cream-fade" aria-hidden="true" />
      <main>
        <Services />
        <Features />
        <Network />
        {/* bloc sombre juste au-dessus du footer : « #1 de la logistique » puis Contact */}
        <About />
        <div className="contact-band">
          <Contact />
        </div>
      </main>
      <Footer />
      <Scrollbar />
    </>
  )
}
