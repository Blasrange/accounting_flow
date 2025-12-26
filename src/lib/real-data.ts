import connection from "./db";

// Obtener todos los usuarios de la tabla 'users' (en inglés)
export async function getAllUsers(): Promise<User[]> {
  const [rows] = await connection.execute("SELECT * FROM users");
  return rows as User[];
}

// Interfaces
interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
}

interface Product {
  id: number;
  dispatch_id: number;
  name: string;
  [key: string]: any;
}

interface Dispatch {
  id: number;
  [key: string]: any;
}

interface DispatchWithProducts extends Dispatch {
  products: Product[];
}

// Obtener todos los despachos de la tabla 'dispatches' y sus productos relacionados
export async function getAllDispatches(): Promise<DispatchWithProducts[]> {
  // Traer despachos
  const [dispatchRows] = await connection.execute("SELECT * FROM dispatches");
  // Traer productos relacionados
  const [productRows] = await connection.execute("SELECT * FROM products");

  // Mapear productos a cada despacho
  const dispatches = (dispatchRows as Dispatch[]).map(
    (dispatch): DispatchWithProducts => ({
      ...dispatch,
      products: (productRows as Product[]).filter(
        (p) => p.dispatch_id === dispatch.id
      ),
    })
  );
  return dispatches;
}
