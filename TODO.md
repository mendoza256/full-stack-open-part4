4.18
[X] add test for to test token authentication

4.19
[X] posting blogs is only possible with authenticated token
[X] token should verify user that posted blog

4.20
[X] refactor getTokenFrom function to be middleware (should take token from auth header, assign to token field of req object)

4.21
[X] blog can only be deleted by user who created it (deleting blog only if token sent is same as of the blog's creator.)
[X] If deleting a blog is attempted without a token or by an invalid user, the operation should return a suitable status code.
