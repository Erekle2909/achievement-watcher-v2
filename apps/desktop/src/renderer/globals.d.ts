// Allow importing CSS files in the renderer (handled by Vite at runtime)
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
