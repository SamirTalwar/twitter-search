module Main exposing (main)

import Date exposing (Date)
import Html exposing (Html, br, div, li, p, span, text)
import Html.App as App
import Html.Attributes exposing (class)
import Html.Keyed exposing (ul)
import Json.Decode as Json exposing ((:=))
import WebSocket

main =
  App.program {
    init = init,
    update = update,
    view = view,
    subscriptions = always <| WebSocket.listen server decode
  }

server = "ws://localhost:8081"

type alias Message = Result String (List Tweet)

type alias Model = { error : Maybe String, tweets : List Tweet }
type alias Error = String
type alias Tweet =
  {
    id : String,
    screenName : String,
    text : String,
    timestamp : Date
  }

init : (Model, Cmd Message)
init = Model Nothing [] ! []

update : Message -> Model -> (Model, Cmd Message)
update message model =
  case message of
    Err error ->
      { model | error = Just error } ! []
    Ok tweets ->
      { error = Nothing, tweets = tweets } ! []

view : Model -> Html Message
view model =
  div [class "app"] <|
    case model.error of
      Just error ->
        [
          p [] [
            text "We received an error from the server.",
            br [] [],
            text error
          ],
          viewTweets model.tweets
        ]
      Nothing ->
        [
          viewTweets model.tweets
        ]

viewTweets tweets =
  ul [class "tweets"] (tweets |> List.take 10 |> List.map (\tweet ->
    (tweet.id, li [class "tweet"] [
      span [class "screen-name"] [text "@", text tweet.screenName],
      text ": ",
      span [class "text"] [text tweet.text],
      br [] [],
      span [class "timestamp"] [text (toString tweet.timestamp)]
    ])
  ))

decode = Json.decodeString tweetsDecoder

tweetsDecoder = "statuses" := Json.list tweetDecoder

tweetDecoder =
  Json.object4 Tweet
    ("id_str" := Json.string)
    (Json.at ["user", "screen_name"] Json.string)
    ("text" := Json.string)
    ("created_at" := dateDecoder)

dateDecoder = Json.customDecoder Json.string Date.fromString
