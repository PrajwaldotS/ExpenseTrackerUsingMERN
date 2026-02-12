import app from "./app"

const PORT = process.env.PORT || 2294

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
