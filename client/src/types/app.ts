/** App record returned by the apps API. */
export interface App {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  isActive: boolean;
  route?: string;
}
