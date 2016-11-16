module Main exposing (main)

import Date exposing (Date)
import Html exposing (Html, br, div, li, p, span, text)
import Html.App as App
import Html.Attributes exposing (class, classList)
import Html.Keyed exposing (ul)
import Json.Decode as Json exposing ((:=))
import Set
import WebSocket

main : Program Never
main =
  App.program {
    init = init,
    update = update,
    view = view,
    subscriptions = always <| WebSocket.listen server decode
  }

server : String
server = "ws://localhost:8081"

tweetLimit : Int
tweetLimit = 10

type alias Message = Result String (List Tweet)

type alias Model = { error : Maybe String, tweets : List Tweet }
type alias Error = String
type alias Tweet =
  {
    id : String,
    screenName : String,
    text : String,
    timestamp : Date,
    new : Bool
  }

init : (Model, Cmd Message)
init = Model Nothing [] ! []

update : Message -> Model -> (Model, Cmd Message)
update message model =
  let
    oldTweetIds = model.tweets |> List.map (\tweet -> tweet.id) |> Set.fromList
    oldTweets = model.tweets |> List.map (\tweet -> { tweet | new = False }) |> List.take tweetLimit
  in
    case message of
      Err error ->
        { error = Just error, tweets = oldTweets } ! []
      Ok tweets ->
        let
          newTweets = List.filter (\tweet -> not (Set.member tweet.id oldTweetIds)) tweets
        in
          { error = Nothing, tweets = newTweets ++ oldTweets } ! []

view : Model -> Html Message
view model =
  div [class "app"] <|
    case model.error of
      Just error ->
        [
          viewError error,
          viewTweets model.tweets
        ]
      Nothing ->
        [
          viewTweets model.tweets
        ]

viewError : Error -> Html Message
viewError error =
  p [class "error"] [
    text "We received an error from the server.",
    br [] [],
    text error
  ]

viewTweets : List Tweet -> Html Message
viewTweets tweets =
  ul [class "tweets"] (tweets |> List.take 10 |> List.map (\tweet ->
    (tweet.id, li [classList [("tweet", True), ("new", tweet.new)]] [
      span [class "timestamp"] [
        text (Date.month tweet.timestamp |> toString),
        text " ",
        text (Date.day tweet.timestamp |> toString),
        text " ",
        text (Date.hour tweet.timestamp |> pad),
        text ":",
        text (Date.minute tweet.timestamp |> pad),
        text ":",
        text (Date.second tweet.timestamp |> pad)
      ],
      text " from @",
      span [class "screen-name"] [text tweet.screenName],
      text ": ",
      span [class "text"] [text tweet.text]
    ])
  ))

pad : Int -> String
pad n = if n < 10 then "0" ++ (toString n) else toString n

decode : String -> Result String (List Tweet)
decode = Json.decodeString tweetsDecoder

tweetsDecoder : Json.Decoder (List Tweet)
tweetsDecoder = "statuses" := Json.list tweetDecoder

tweetDecoder : Json.Decoder Tweet
tweetDecoder =
  Json.object5 Tweet
    ("id_str" := Json.string)
    (Json.at ["user", "screen_name"] Json.string)
    ("text" := Json.string)
    ("created_at" := dateDecoder)
    (Json.succeed True)

dateDecoder : Json.Decoder Date
dateDecoder = Json.customDecoder Json.string Date.fromString
