import { Link } from "react-router-dom"

function Navbar() {
  return (
    <nav className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Gestion des Livres</h1>
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="text-blue-500 hover:text-blue-700">
            Liste des Livres
          </Link>
        </li>
        <li>
          <Link to="/add-book" className="text-blue-500 hover:text-blue-700">
            Ajouter un Livre
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar

