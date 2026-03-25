import type { CategoriaAnimale } from '@/lib/types/app.types'

export const SPECIE_PER_CATEGORIA: Record<CategoriaAnimale, string[]> = {
  cani: [
    'Labrador Retriever', 'Pastore Tedesco', 'Golden Retriever', 'Bulldog Francese',
    'Barboncino', 'Beagle', 'Boxer', 'Chihuahua', 'Husky Siberiano', 'Shih Tzu',
    'Maltese', 'Yorkshire Terrier', 'Carlino', 'Dobermann', 'Rottweiler',
    'Cocker Spaniel', 'Dalmata', 'Setter Irlandese', 'Alano', 'Bassotto',
    'Border Collie', 'Cane Corso', 'Lagotto Romagnolo', 'Bracco Italiano',
    'Segugio Italiano', 'Spinone Italiano', 'Volpino Italiano',
  ],
  gatti: [
    'Europeo Comune', 'Persiano', 'Maine Coon', 'Siamese', 'Bengala',
    'Ragdoll', 'British Shorthair', 'Abissino', 'Sphynx', 'Certosino',
    'Sacro di Birmania', 'Norvegese delle Foreste', 'Siberiano', 'Angora Turco',
    'Russian Blue', 'Burmese', 'Devon Rex', 'Cornish Rex', 'Scottish Fold',
    'Ocicat', 'Tonkinese', 'Bosco della Norvegia',
  ],
  pesci: [
    'Pesce Rosso', 'Carassius', 'Betta', 'Guppy', 'Neon Tetra',
    'Ciclide Africano', 'Discus', 'Scalare', 'Molly', 'Platy',
    'Corydoras', 'Pleco', 'Koi', 'Danio', 'Barbo', 'Rasbora',
    'Pesce Palla', 'Arowana', 'Pterofillo', 'Loach Clown',
  ],
  uccelli: [
    'Cocorita', 'Canarino', 'Pappagallo Grigio Africano', 'Cacatua',
    'Ara', 'Amazzone', 'Calopsita', 'Rosella', 'Pappagallino del Senegal',
    'Turdus Merula', 'Fringuello', 'Cardellino', 'Verdone', 'Diamante Mandarino',
    'Pappagallo Ecletto', 'Lorichetto', 'Parrocchetto Monaco', 'Ninfaparakeet',
  ],
  rettili: [
    'Geco Leopardino', 'Drago Barbuto', 'Iguana Verde', 'Camaleonte Velato',
    'Serpente del Grano', 'Boa Constrictor', 'Pitone Reale', 'Tartaruga di Terra',
    'Tartaruga Acquatica', 'Caiman', 'Anolis', 'Lucertola Blu',
    'Monitor Acanthurus', 'Geco Diurno del Madagascar', 'Skink Porcellino',
    'Serpente Re della California', 'Boa Arcobaleno', 'Geco Crestato',
  ],
  piccoli_mammiferi: [
    'Criceto Dorato', 'Criceto Nano', 'Coniglio Nano', 'Cavia',
    'Cincillà', 'Ratto Domestico', 'Topo Domestico', 'Gerbillo',
    'Furetto', 'Porcospino Africano', 'Degu', 'Prairie Dog',
    'Scoiattolo Striato', 'Coniglio Ariete', 'Coniglio Rex',
  ],
  altri_animali: [
    'Tarantola', 'Scorpione', 'Mille Piedi', 'Lumaca Gigante Africana',
    'Granchio Eremita', 'Gambero d\'acqua dolce', 'Rana Albero',
    'Raganella', 'Axolotl', 'Stella Marina', 'Riccio di Mare',
  ],
}

export const RAZZE_PER_CATEGORIA: Record<CategoriaAnimale, string[]> = {
  cani: [
    'Labrador Retriever', 'Pastore Tedesco', 'Golden Retriever', 'Bulldog Francese',
    'Barboncino Toy', 'Barboncino Nano', 'Barboncino Medio', 'Beagle',
    'Boxer', 'Chihuahua pelo corto', 'Chihuahua pelo lungo', 'Husky Siberiano',
    'Shih Tzu', 'Maltese', 'Yorkshire Terrier', 'Carlino', 'Dobermann',
    'Rottweiler', 'Cocker Spaniel Inglese', 'Cocker Spaniel Americano',
    'Dalmata', 'Setter Irlandese', 'Alano', 'Bassotto pelo corto',
    'Bassotto pelo lungo', 'Border Collie', 'Cane Corso', 'Lagotto Romagnolo',
    'Bracco Italiano', 'Segugio Italiano', 'Meticcio',
  ],
  gatti: [
    'Europeo Comune', 'Persiano', 'Persiano Chinchilla', 'Maine Coon',
    'Siamese Tradizionale', 'Siamese Moderno', 'Bengala', 'Ragdoll',
    'British Shorthair', 'British Longhair', 'Abissino', 'Sphynx',
    'Certosino', 'Sacro di Birmania', 'Norvegese delle Foreste', 'Siberiano',
    'Angora Turco', 'Russian Blue', 'Burmese', 'Devon Rex', 'Cornish Rex',
    'Scottish Fold', 'Scottish Straight', 'Meticcio',
  ],
  pesci: [],
  uccelli: [],
  rettili: [],
  piccoli_mammiferi: [
    'Criceto Dorato', 'Criceto Nano Russo', 'Criceto Nano Roborowski',
    'Coniglio Nano Olandese', 'Coniglio Ariete Nano', 'Coniglio Rex',
    'Coniglio Angora', 'Cavia Americana', 'Cavia Peruviana', 'Cavia Teddy',
    'Cincillà Standard', 'Cincillà di Velvet', 'Furetto Albino',
    'Furetto Panda', 'Meticcio',
  ],
  altri_animali: [],
}