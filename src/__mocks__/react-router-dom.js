// Mock for react-router-dom
export const withRouter = (Component) => Component;
export const MemoryRouter = ({ children }) => <div>{children}</div>;
export const Link = ({ children, ...props }) => <a {...props}>{children}</a>;
export const useNavigate = () => jest.fn();
export const useLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'testKey',
});

export default {
  withRouter,
  MemoryRouter,
  Link,
  useNavigate,
  useLocation,
};
