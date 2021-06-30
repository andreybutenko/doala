# [Try Doala!](https://doala.wndr.dev)

Doala is the to-do app for koala fans!
* Happy koala mascot!
* Dark mode!
* The user experience is designed to speed up most workflows through keyboard shortcuts.
* Your lists are safely saved on your computer and are never shared.

Built as part of CSE 154: Web Programming at the University of Washington in April 2019.

## Running locally

Use any static file server to host the `frontend` directory.

## Deployment to doala.wndr.dev

### Build Docker Image

```
docker build -t andreybutenko/doala .

docker push andreybutenko/doala
```

### Deploy Docker Image

Running on `us-west-2/projects-a`

```
docker pull andreybutenko/doala

docker rm -f doala

docker start -p 3001:80 --name doala -d andreybutenko/doala
```
